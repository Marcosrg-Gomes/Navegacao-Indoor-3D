# Decisões Técnicas e Arquiteturais

1. **API Key vs JWT**: Optou-se pelo uso de API Key em vez de JWT para simplificar a proteção dos endpoints administrativos no MVP (Minimum Viable Product).

2. **Coordenadas Normalizadas**: Decidimos normalizar as coordenadas no intervalo de `0.0` a `1.0`. Isso garante que a renderização do mapa no front-end e mobile seja independente da resolução original.

3. **heapq para Dijkstra**: Utilizaremos a biblioteca padrão `heapq` do Python para implementar o algoritmo de Dijkstra (caminho mais curto). Isso evita dependências desnecessárias para cálculos de roteamento simples.

4. **Soft delete vs hard delete**: Os endpoints de administração usarão hard delete apenas quando necessário, mas na maior parte do tempo utilizaremos uma flag booleana `ativo` para "soft deletes" (inativação lógica), mantendo o histórico referencial no banco.

5. **Auto-cálculo de distância**: Como temos coordenadas de nós e a dimensão do piso (largura e altura em metros), o sistema ou scripts de seed podem calcular a distância entre os nós automaticamente, em vez de dependerem de entrada manual.

6. **Expo for React Native**: O uso do Expo simplificará e agilizará o desenvolvimento da aplicação mobile, oferecendo testes mais fáceis durante a fase de prototipagem.

7. **Token QR Code**: Optamos por usar tokens baseados em UUIDs ou strings legíveis para humanos (como "ENTRADA-PRINCIPAL") em vez de guardar referências diretas de banco de dados nos QR codes. Isso melhora a resiliência caso os IDs de banco mudem.
