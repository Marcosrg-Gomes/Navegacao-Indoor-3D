import heapq
import math
from typing import Optional, List, Tuple, Dict
from sqlalchemy.orm import Session
from app.models import No, Aresta, Piso

class NavigationEngine:
    """Motor de navegação indoor usando algoritmo de Dijkstra."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calcular_rota(self, origem_id: int, destino_id: int, acessivel: bool = False) -> dict:
        """Calcula a rota mais curta entre dois nós usando Dijkstra.
        
        Args:
            origem_id: ID do nó de origem
            destino_id: ID do nó de destino
            acessivel: Se True, considera apenas arestas acessíveis
            
        Returns:
            Dict with keys: sucesso, rota (nos, distancia_total_metros, instrucoes) or mensagem
        """
        no_origem = self.db.query(No).filter(No.id == origem_id, No.ativo == True).first()
        no_destino = self.db.query(No).filter(No.id == destino_id, No.ativo == True).first()

        if not no_origem or not no_destino:
            return {"sucesso": False, "mensagem": "Nó de origem ou destino não encontrado ou inativo."}
            
        graph = self._build_graph(acessivel)
        
        caminho_ids, distancia = self._dijkstra(graph, origem_id, destino_id)
        
        if caminho_ids is None or distancia is None:
            return {"sucesso": False, "mensagem": "Não foi possível encontrar uma rota entre os nós especificados."}
            
        # Carregar nós completos para gerar instruções
        nos_dict = {no.id: no for no in self.db.query(No).filter(No.id.in_(caminho_ids)).all()}
        nos_caminho = [nos_dict[no_id] for no_id in caminho_ids]
        
        instrucoes = self._gerar_instrucoes(nos_caminho)
        
        nos_serializados = [{
            "id": no.id,
            "nome": no.nome,
            "tipo": no.tipo,
            "coord_x": no.coord_x,
            "coord_y": no.coord_y,
            "piso_id": no.piso_id
        } for no in nos_caminho]
        
        return {
            "sucesso": True,
            "rota": {
                "nos": nos_serializados,
                "distancia_total_metros": round(distancia, 2),
                "instrucoes": instrucoes
            }
        }

    def _build_graph(self, acessivel: bool = False) -> dict:
        """Constrói o grafo de adjacência a partir das arestas ativas no banco."""
        query = self.db.query(Aresta).filter(Aresta.ativo == True)
        if acessivel:
            query = query.filter(Aresta.acessivel == True)
            
        arestas = query.all()
        
        graph = {}
        for aresta in arestas:
            if aresta.origem_id not in graph:
                graph[aresta.origem_id] = []
            if aresta.destino_id not in graph:
                graph[aresta.destino_id] = []
                
            graph[aresta.origem_id].append((aresta.destino_id, aresta.distancia))
            
            if aresta.bidirecional:
                graph[aresta.destino_id].append((aresta.origem_id, aresta.distancia))
                
        return graph

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

    def _gerar_instrucoes(self, nos: List[No]) -> List[str]:
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
            distancia_segmento = self.calcular_distancia(atual, proximo)
            
            # Tratamento de mudança de piso (elevador ou escada)
            if atual.piso_id != proximo.piso_id:
                tipo = proximo.tipo
                piso_destino = proximo.piso_id
                if tipo == 'elevador' or atual.tipo == 'elevador':
                    instrucoes.append(f"Use o elevador para o piso {piso_destino}")
                elif tipo == 'escada' or atual.tipo == 'escada':
                    instrucoes.append(f"Suba as escadas para o piso {piso_destino}")
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
                        angle_ab = math.atan2(atual.coord_y - anterior.coord_y, atual.coord_x - anterior.coord_x)
                        angle_bc = math.atan2(proximo.coord_y - atual.coord_y, proximo.coord_x - atual.coord_x)
                        
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
                    angle_ab = math.atan2(atual.coord_y - anterior.coord_y, atual.coord_x - anterior.coord_x)
                    angle_bc = math.atan2(proximo.coord_y - atual.coord_y, proximo.coord_x - atual.coord_x)
                    
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
        dx = (no2.coord_x - no1.coord_x) * largura
        dy = (no2.coord_y - no1.coord_y) * altura
        
        return math.sqrt(dx**2 + dy**2)
