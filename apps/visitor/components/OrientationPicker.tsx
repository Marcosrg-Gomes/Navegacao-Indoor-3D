import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "@/context/NavigationContext";
import { normalize, useDirectory } from "@/hooks/useDirectory";
import type { No } from "@/types";
import { AccessibleSheet } from "./AccessibleSheet";
import { DirectoryMap } from "./DirectoryMap";
import { directoryStyles as d, rule, ink } from "./directoryDesign";

export function OrientationPicker({ visible, lost = false, onClose, onLocate }: { visible: boolean; lost?: boolean; onClose: () => void; onLocate: () => void }) {
  const nav = useNavigation(), router = useRouter(), directory = useDirectory(visible);
  const [query, setQuery] = useState(""), [selected, setSelected] = useState<No | null>(null), [map, setMap] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const suggestions = query.trim().length >= 2
    ? directory.places.filter((place) => normalize(place.name).includes(normalize(query))).slice(0, 12)
    : directory.places.filter((place) => place.node.tipo === "entrada").slice(0, 4);
  useEffect(() => { if (visible) { setSelected(null); setQuery(""); setError(""); } }, [visible]);
  async function confirm() {
    if (!selected) return;
    setBusy(true); setError("");
    try { await nav.setOriginNode(selected, "manual"); onClose(); onLocate(); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível atualizar a posição."); }
    finally { setBusy(false); }
  }
  return <AccessibleSheet visible={visible} title={lost ? "Vamos encontrar você." : "O que você vê perto de você?"} onClose={onClose}
    footer={selected ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={"Confirmar minha posição em " + selected.nome} accessibilityState={{ disabled: busy }} disabled={busy} style={d.button} onPress={() => void confirm()}><Text style={d.buttonText}>{busy ? "Atualizando…" : "Estou na entrada de " + selected.nome}</Text></TouchableOpacity> : undefined}>
    <View style={d.row}><TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => { onClose(); router.push("/scan"); }}><Text style={d.linkText}>Ler outra placa QR ↗</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: map }} style={d.link} onPress={() => setMap(!map)}><Text style={d.linkText}>{map ? "Escolher pelo nome" : "Escolher no mapa"}</Text></TouchableOpacity></View>
    {lost && nav.originNode && <View style={d.line}><Text style={d.label}>ÚLTIMA POSIÇÃO CONFIRMADA</Text><Text style={d.text}>{nav.originNode.nome}</Text><TouchableOpacity accessibilityRole="button" style={d.link} onPress={() => { onClose(); onLocate(); }}><Text style={d.linkText}>Rever o caminho a partir daqui</Text></TouchableOpacity><Text style={d.muted}>Isso mostra o ponto anterior; não significa que você voltou fisicamente até ele.</Text></View>}
    <Text style={d.text}>Escolha um lugar que você consegue ver. Confirme quando estiver na entrada dele.</Text>
    {error && <Text accessibilityRole="alert" style={d.text}>{error}</Text>}
    {directory.error && <Text accessibilityRole="alert" style={d.text}>{directory.error}</Text>}
    {map ? <DirectoryMap floors={nav.floors} graphs={directory.graphs} selected={selected} origin={nav.originNode} onSelect={setSelected} /> : <>
      <TextInput accessibilityLabel="Lugar que estou vendo" value={query} onChangeText={setQuery} placeholder="Digite uma loja ou serviço" style={{ minHeight: 54, padding: 12, borderWidth: 1, borderColor: rule, borderRadius: 10, color: ink, fontSize: 17 }} />
      {query.trim().length < 2 && <Text style={d.muted}>Digite ao menos duas letras. Você também pode escolher uma entrada abaixo.</Text>}
      {suggestions.map((place) => <TouchableOpacity key={place.key} accessibilityRole="button" accessibilityLabel={"Estou vendo " + place.name} accessibilityState={{ selected: selected?.id === place.node.id }} style={[d.line, { paddingHorizontal: 8, backgroundColor: selected?.id === place.node.id ? "#fff2c8" : "transparent" }]} onPress={() => setSelected(place.node)}><Text style={[d.text, { fontWeight: "700" }]}>{selected?.id === place.node.id ? "✓ " : ""}{place.name}</Text><Text style={d.muted}>{nav.floors.find((floor) => floor.id === place.node.piso_id)?.nome} · {place.category}</Text></TouchableOpacity>)}
      {query.trim().length >= 2 && !suggestions.length && !directory.loading && <Text style={d.muted}>Nenhum lugar encontrado. Tente outro nome ou leia um QR Code.</Text>}
    </>}
    {selected && <Text style={d.text}>Nova origem: {selected.nome}. O destino atual será mantido e o trajeto será recalculado.</Text>}
  </AccessibleSheet>;
}
