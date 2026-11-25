from locust import HttpUser, task, between

class VisitanteUser(HttpUser):
    """Simula usuários visitantes acessando a API de navegação indoor."""
    wait_time = between(1, 3)
    host = "http://127.0.0.1:8766"

    @task(3)
    def listar_shoppings(self):
        self.client.get("/api/shoppings")

    @task(3)
    def listar_pois(self):
        self.client.get("/api/pois")

    @task(2)
    def resolver_qr(self):
        self.client.get("/api/qr-codes/MINI-ENTRADA-PRINCIPAL")

    @task(1)
    def calcular_rota(self):
        self.client.post("/api/routes", json={
            "origem_no_id": 45,
            "destino_no_id": 7,
            "acessivel": False,
            "confirmar_indisponivel": False
        })

    @task(1)
    def diagnosticos(self):
        self.client.get("/api/diagnostics")
