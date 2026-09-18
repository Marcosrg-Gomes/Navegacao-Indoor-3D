import heapq
import math
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models import Aresta, No, Piso, Shopping

class NavigationEngine:
    """Motor de navegação indoor usando algoritmo de Dijkstra."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calcular_rota(self, origem_id: int, destino_id: int, acessivel: bool = False) -> dict:
        """Calcula a rota mais curta entre dois nós usando Dijkstra."""
        no_origem = self._obter_no_navegavel(origem_id)
        no_destino = self._obter_no_navegavel(destino_id)

        if not no_origem or not no_destino:
            return {"sucesso": False, "mensagem": "Nó de origem ou destino não encontrado ou inativo."}

        if no_origem.piso.shopping_id != no_destino.piso.shopping_id:
            # A route must never escape the shopping in which the QR origin was
            # resolved (RN04), even when malformed edges exist in the database.
            return {
                "sucesso": False,
                "mensagem": "Os nós de origem e destino pertencem a shoppings diferentes.",
                "status_code": 400,
            }

        graph = self._build_graph(
            acessivel=acessivel,
            shopping_id=no_origem.piso.shopping_id,
        )

        caminho_ids, distancia = self._dijkstra(graph, origem_id, destino_id)

        if caminho_ids is None or distancia is None:
            return {"sucesso": False, "mensagem": "Não foi possível encontrar uma rota entre os nós especificados."}

        nos_dict = {no.id: no for no in self.db.query(No).filter(No.id.in_(caminho_ids)).all()}
        nos_caminho = [nos_dict[no_id] for no_id in caminho_ids]

        segmentos = self._segmentos_do_caminho(graph, caminho_ids)
        instrucoes = self._gerar_instrucoes(nos_caminho, segmentos)

        nos_serializados = [{
            "id": no.id,
            "nome": no.nome,
            "tipo": no.tipo,
            "coord_x": float(no.coord_x),
            "coord_y": float(no.coord_y),
            "piso_id": no.piso_id
        } for no in nos_caminho]

        return {
            "sucesso": True,
            "nos": nos_serializados,
            "distancia_total_metros": round(float(distancia), 2),
            "instrucoes": instrucoes
        }

    def _obter_no_navegavel(self, no_id: int) -> Optional[No]:
        """Return a node only when its complete public hierarchy is active."""
        return (
            self.db.query(No)
            .join(Piso, No.piso_id == Piso.id)
            .join(Shopping, Piso.shopping_id == Shopping.id)
            .filter(
                No.id == no_id,
                No.ativo.is_(True),
                Piso.ativo.is_(True),
                Shopping.ativo.is_(True),
                No.coord_x.between(0, 1),
                No.coord_y.between(0, 1),
            )
            .first()
        )

    def _build_graph(self, acessivel: bool = False, shopping_id: Optional[int] = None) -> Dict[int, List[Tuple[int, float]]]:
        """Build a fresh adjacency graph from navigable nodes and active edges.

        The graph is intentionally rebuilt for every request.  That makes an
        admin edge deactivation/reactivation effective on the very next route
        calculation, with no stale cache to invalidate.
        """
        nodes_query = (
            self.db.query(No)
            .join(Piso, No.piso_id == Piso.id)
            .join(Shopping, Piso.shopping_id == Shopping.id)
            .filter(No.ativo.is_(True), Piso.ativo.is_(True), Shopping.ativo.is_(True))
            .filter(No.coord_x.between(0, 1), No.coord_y.between(0, 1))
        )
        if shopping_id is not None:
            nodes_query = nodes_query.filter(Shopping.id == shopping_id)

        nos_navegaveis = {node.id: node for node in nodes_query.all()}

        query = self.db.query(Aresta).filter(Aresta.ativa.is_(True))
        if acessivel:
            query = query.filter(Aresta.acessivel.is_(True))

        arestas = query.all()

        graph: Dict[int, List[Tuple[int, float]]] = {}
        for aresta in arestas:
            origem = aresta.no_origem_id
            destino = aresta.no_destino_id

            # Inactive/deleted hierarchy members and malformed cross-shopping
            # links are never traversable (RN03, RN04 and RN07).
            if origem not in nos_navegaveis or destino not in nos_navegaveis:
                continue

            source, target = nos_navegaveis[origem], nos_navegaveis[destino]
            if source.piso_id != target.piso_id and (
                source.tipo not in {"escada", "elevador"} or target.tipo not in {"escada", "elevador"}
            ):
                continue
            if acessivel and "escada" in (source.tipo, target.tipo):
                continue

            peso = float(aresta.distancia or 0)
            if not math.isfinite(peso) or peso <= 0:
                continue

            graph.setdefault(origem, [])
            graph.setdefault(destino, [])

            graph[origem].append((destino, peso))

            if aresta.bidirecional:
                graph[destino].append((origem, peso))

        return graph

    @staticmethod
    def _segmentos_do_caminho(
        graph: Dict[int, List[Tuple[int, float]]], caminho_ids: List[int]
    ) -> List[float]:
        """Return the actual persisted weight used for each path segment."""
        segmentos: List[float] = []
        for origem, destino in zip(caminho_ids, caminho_ids[1:]):
            pesos = [peso for vizinho, peso in graph.get(origem, []) if vizinho == destino]
            # Dijkstra must have reached ``destino`` through one of these edges.
            # The fallback merely keeps instructions resilient to malformed data.
            segmentos.append(min(pesos) if pesos else 0.0)
        return segmentos

    def _dijkstra(self, graph: dict, origem_id: int, destino_id: int) -> Tuple[Optional[List[int]], Optional[float]]:
        """Executa o algoritmo de Dijkstra.
        
        Returns:
            Tuple of (path: list[int], distance: float) or (None, None) if no path
        """
        if origem_id not in graph or destino_id not in graph:
            # Caso em que um dos nós não possui arestas (pode estar isolado)
            if origem_id == destino_id:
                return [origem_id], 0.0
            return None, None
            
        distancias = {no: float('inf') for no in graph}
        distancias[origem_id] = 0.0
        predecessores = {no: None for no in graph}
        
        fila_prioridade = [(0.0, origem_id)]
        
        while fila_prioridade:
            distancia_atual, no_atual = heapq.heappop(fila_prioridade)
            
            if no_atual == destino_id:
                break
                
            if distancia_atual > distancias.get(no_atual, float('inf')):
                continue
                
            for vizinho, peso in graph.get(no_atual, []):
                distancia = distancia_atual + peso
                
                if distancia < distancias.get(vizinho, float('inf')):
                    distancias[vizinho] = distancia
                    predecessores[vizinho] = no_atual
                    heapq.heappush(fila_prioridade, (distancia, vizinho))
                    
        if distancias.get(destino_id, float('inf')) == float('inf'):
            return None, None
            
        # Reconstruir caminho
        caminho = []
        atual = destino_id
        while atual is not None:
            caminho.append(atual)
            atual = predecessores.get(atual)
            
        caminho.reverse()
        return caminho, distancias[destino_id]

    def _gerar_instrucoes(self, nos: List[No], segmentos: Optional[List[float]] = None) -> List[str]:
        """Gera instruções de navegação passo a passo.
        """
        if not nos:
            return []
            
        instrucoes = []
        origem = nos[0]
        nome_origem = origem.nome if origem.nome else origem.tipo
        instrucoes.append(f"Partindo de {nome_origem} (ponto de origem)")
        
        if len(nos) == 1:
            instrucoes.append(f"Você já está no destino: {nome_origem}")
            return instrucoes
            
        for i in range(len(nos) - 1):
            atual = nos[i]
            proximo = nos[i + 1]
            distancia_segmento = (
                segmentos[i]
                if segmentos is not None and i < len(segmentos)
                else self.calcular_distancia(atual, proximo)
            )
            
            # Tratamento de mudança de piso (elevador ou escada)
            if atual.piso_id != proximo.piso_id:
                tipo = proximo.tipo
                piso_destino = proximo.piso.nome
                if tipo == 'elevador' or atual.tipo == 'elevador':
                    instrucoes.append(f"Use o elevador para o piso {piso_destino}")
                elif tipo == 'escada' or atual.tipo == 'escada':
                    verbo = "Suba" if proximo.piso.nivel > atual.piso.nivel else "Desça"
                    instrucoes.append(f"{verbo} as escadas para {piso_destino}")
                else:
                    instrucoes.append(f"Vá para o piso {piso_destino}")
                continue
                
            # Tratamento especial de destino baseado no tipo
            if proximo.tipo == 'banheiro' and i == len(nos) - 2:
                # Último passo em direção ao banheiro
                direcao_str = "frente"
                if i > 0:
                    anterior = nos[i - 1]
                    if anterior.piso_id == atual.piso_id:
                        angle_ab = math.atan2(float(atual.coord_y) - float(anterior.coord_y), float(atual.coord_x) - float(anterior.coord_x))
                        angle_bc = math.atan2(float(proximo.coord_y) - float(atual.coord_y), float(proximo.coord_x) - float(atual.coord_x))
                        
                        delta = math.degrees(angle_bc - angle_ab)
                        delta = (delta + 180) % 360 - 180
                        
                        if 30 <= delta <= 150:
                            direcao_str = "direita"
                        elif -150 <= delta <= -30:
                            direcao_str = "esquerda"
                instrucoes.append(f"Banheiro à sua {direcao_str} por {distancia_segmento:.1f} metros")
                continue
                
            # Movimento normal
            if i == 0:
                instrucoes.append(f"Siga em frente por {distancia_segmento:.1f} metros")
            else:
                anterior = nos[i - 1]
                # Só calcula ângulo se os 3 nós estiverem no mesmo piso
                if anterior.piso_id == atual.piso_id and atual.piso_id == proximo.piso_id:
                    angle_ab = math.atan2(float(atual.coord_y) - float(anterior.coord_y), float(atual.coord_x) - float(anterior.coord_x))
                    angle_bc = math.atan2(float(proximo.coord_y) - float(atual.coord_y), float(proximo.coord_x) - float(atual.coord_x))
                    
                    delta = math.degrees(angle_bc - angle_ab)
                    delta = (delta + 180) % 360 - 180
                    
                    direcao = "Siga em frente"
                    if 30 <= delta <= 150:
                        direcao = "Vire à direita"
                    elif -150 <= delta <= -30:
                        direcao = "Vire à esquerda"
                        
                    instrucoes.append(f"{direcao} por {distancia_segmento:.1f} metros")
                else:
                    instrucoes.append(f"Siga em frente por {distancia_segmento:.1f} metros")
                    
        destino = nos[-1]
        nome_destino = destino.nome if destino.nome else destino.tipo
        instrucoes.append(f"Você chegou ao destino: {nome_destino}")
        
        return instrucoes

    @staticmethod
    def calcular_distancia(no1: No, no2: No, largura: float = 100.0, altura: float = 100.0) -> float:
        """Calcula distância euclidiana entre dois nós usando coordenadas normalizadas.
        
        Converts normalized coords to meters using floor dimensions.
        distance = sqrt((dx * largura)^2 + (dy * altura)^2)
        """
        dx = (float(no2.coord_x) - float(no1.coord_x)) * largura
        dy = (float(no2.coord_y) - float(no1.coord_y)) * altura
        
        return math.sqrt(dx**2 + dy**2)
