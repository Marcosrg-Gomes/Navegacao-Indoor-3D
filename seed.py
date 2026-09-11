import math
from app.database import engine, Base, SessionLocal
from app.models import Shopping, Categoria, Piso, No, Aresta, Loja, QRCode

def calc_dist(n1, n2, width_m=100.0, height_m=60.0):
    dx = float(n1.coord_x - n2.coord_x) * width_m
    dy = float(n1.coord_y - n2.coord_y) * height_m
    return math.sqrt(dx**2 + dy**2)

def seed_db():
    print("Iniciando seed do banco de dados...")
    
    # Seed somente em base vazia; nunca apaga cadastros existentes.
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    if db.query(Shopping).first():
        print("Banco já possui dados. Seed ignorado para preservar os cadastros.")
        db.close()
        return
    
    try:
        # 3. Create data
        print("Criando Shopping...")
        shopping = Shopping(
            nome="Shopping Demo Center",
            endereco="Av. Brasil, 1000 - Centro",
            latitude=-23.5505,
            longitude=-46.6333,
            ativo=True
        )
        db.add(shopping)
        db.commit()
        
        print("Criando Categorias...")
        categorias = [
            Categoria(nome="Alimentação", icone="restaurant"),
            Categoria(nome="Moda", icone="shirt"),
            Categoria(nome="Tecnologia", icone="laptop"),
            Categoria(nome="Serviços", icone="tools"),
            Categoria(nome="Entretenimento", icone="gamepad")
        ]
        db.add_all(categorias)
        db.commit()
        
        # Guardar referência de categorias
        cat_map = {c.nome: c for c in categorias}
        
        print("Criando Piso...")
        piso = Piso(
            shopping_id=shopping.id,
            nome="Térreo",
            nivel=0,
            largura_metros=100.0,
            altura_metros=60.0,
            imagem_planta_url="/static/plantas/demo.svg",
            ativo=True
        )
        db.add(piso)
        db.commit()
        
        print("Criando Nós...")
        nos_data = [
            (0.1, 0.5, 'entrada', "Entrada Principal"),
            (0.9, 0.5, 'entrada', "Entrada Lateral"),
            (0.2, 0.5, 'corredor', "Corredor A1"),
            (0.3, 0.5, 'corredor', "Corredor A2"),
            (0.4, 0.5, 'corredor', "Corredor A3"),
            (0.5, 0.5, 'corredor', "Corredor Central"),
            (0.6, 0.5, 'corredor', "Corredor B1"),
            (0.7, 0.5, 'corredor', "Corredor B2"),
            (0.8, 0.5, 'corredor', "Corredor B3"),
            (0.3, 0.3, 'corredor', "Corredor Norte"),
            (0.5, 0.3, 'corredor', "Corredor Norte Central"),
            (0.7, 0.3, 'corredor', "Corredor Norte Leste"),
            (0.3, 0.7, 'corredor', "Corredor Sul"),
            (0.5, 0.7, 'corredor', "Corredor Sul Central"),
            (0.7, 0.7, 'corredor', "Corredor Sul Leste"),
            (0.3, 0.15, 'loja', "Loja Moda Fashion"),
            (0.5, 0.15, 'loja', "TechStore"),
            (0.7, 0.15, 'loja', "Restaurante Sabor"),
            (0.3, 0.85, 'loja', "Cinema Star"),
            (0.5, 0.85, 'loja', "Farmácia Saúde"),
            (0.7, 0.85, 'banheiro', "Banheiro"),
            (0.9, 0.3, 'escada', "Escada Piso Superior")
        ]
        
        nos = []
        for i, (cx, cy, tipo, desc) in enumerate(nos_data, start=1):
            n = No(
                piso_id=piso.id,
                coord_x=cx,
                coord_y=cy,
                tipo=tipo,
                nome=desc,
                ativo=True
            )
            nos.append(n)
        db.add_all(nos)
        db.commit()
        
        # Mapeando N1 a N22 (1-based index) para facilidade
        n_map = {i+1: n for i, n in enumerate(nos)}
        
        print("Criando Arestas...")
        arestas_conexoes = [
            (1, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 8), (8, 9), (9, 2), # Main corridor
            (4, 10), (6, 11), (8, 12), # North branches
            (4, 13), (6, 14), (8, 15), # South branches
            (10, 16), (11, 17), (12, 18), # North shops
            (13, 19), (14, 20), (15, 21), # South shops
            (10, 11), (11, 12), (13, 14), (14, 15), # Cross corridors
            (12, 22) # Escada
        ]
        
        arestas = []
        for u, v in arestas_conexoes:
            n1 = n_map[u]
            n2 = n_map[v]
            dist = calc_dist(n1, n2)
            
            acessivel = False if (u == 15 and v == 21) or (u == 21 and v == 15) else True
            ativa = False if (u == 10 and v == 11) or (u == 11 and v == 10) else True
            
            a1 = Aresta(no_origem_id=n1.id, no_destino_id=n2.id, distancia=dist, bidirecional=True, acessivel=acessivel, ativa=ativa)
            arestas.append(a1)
            
            # Since bidirecional=True, our routing logic usually interprets this. 
            # Depending on graph implementation, we might only need one record, or two. We'll add one record with bidirecional=True
        
        db.add_all(arestas)
        db.commit()
        
        print("Criando Lojas...")
        lojas_data = [
            ("Moda Fashion", 16, "Moda"),
            ("TechStore", 17, "Tecnologia"),
            ("Restaurante Sabor", 18, "Alimentação"),
            ("Cinema Star", 19, "Entretenimento"),
            ("Farmácia Saúde", 20, "Serviços"),
            ("Café Aroma", 5, "Alimentação"),
            ("Ótica VIS", 10, "Serviços"),
            ("Livraria Cultura", 13, "Entretenimento"),
            ("Pet Shop Amigo", 14, "Serviços"),
            ("Joalheria Brilho", 15, "Moda"),
            ("Banheiro", 21, "Serviços")
        ]
        
        lojas = []
        for nome, nid, cat_nome in lojas_data:
            l = Loja(
                no_id=n_map[nid].id,
                categoria_id=cat_map[cat_nome].id,
                nome=nome,
                descricao=f"Descrição da {nome}",
                horario_funcionamento="10:00 - 22:00",
                status_operacional="manutencao" if nome == "Joalheria Brilho" else "fechado" if nome == "Cinema Star" else "aberto",
                ativo=True
            )
            lojas.append(l)
        db.add_all(lojas)
        db.commit()
        
        print("Criando QR Codes...")
        qrcodes_data = [
            ("ENTRADA-PRINCIPAL", 1),
            ("ENTRADA-LATERAL", 2),
            ("CORREDOR-CENTRAL", 6),
            ("NORTE-CENTRAL", 11),
            ("SUL-CENTRAL", 14),
            ("DESTINO-TECHSTORE", 17)
        ]
        
        qrcodes = []
        for token, nid in qrcodes_data:
            q = QRCode(
                token=token,
                no_id=n_map[nid].id,
                ativo=True
            )
            qrcodes.append(q)
        db.add_all(qrcodes)
        db.commit()
        
        print("\n=== Resumo ===")
        print(f"Seed concluído! 1 shoppings, 1 pisos, {len(nos)} nós, {len(arestas)} arestas, {len(lojas)} lojas, {len(categorias)} categorias, {len(qrcodes)} QR codes.")
        
    except Exception as e:
        print(f"Erro durante o seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
