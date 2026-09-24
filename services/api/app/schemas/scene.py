from pydantic import BaseModel, Field


class SceneFloor(BaseModel):
    piso_id: int
    codigo: str
    origin: list[float] = Field(min_length=3, max_length=3)
    axis_x: list[float] = Field(min_length=3, max_length=3)
    axis_y: list[float] = Field(min_length=3, max_length=3)


class ScenePoi(BaseModel):
    loja_id: int
    codigo: str
    object_prefix: str
    anchor_node_id: int


class SceneAnchor(BaseModel):
    node_id: int
    codigo: str
    piso_id: int
    coord_x: float = Field(ge=0, le=1)
    coord_y: float = Field(ge=0, le=1)
    type: str
    name: str


class SceneResponse(BaseModel):
    shopping_id: int
    scene_version: str
    release: int
    model_url: str
    model_sha256: str
    floors: list[SceneFloor]
    pois: list[ScenePoi]
    anchors: list[SceneAnchor]
