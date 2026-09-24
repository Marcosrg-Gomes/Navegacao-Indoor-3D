import copy
import unittest

from config import CONFIG, get_derived, get_navigation_layout
from navigation import build_catalog


class NavigationTests(unittest.TestCase):
    def test_inventory_and_walkable_atrium(self):
        catalog = build_catalog()
        self.assertEqual(sum(p["kind"] == "loja" for p in catalog["pois"].values()), 22)
        self.assertEqual(sum(p["kind"] == "banheiro" for p in catalog["pois"].values()), 4)
        self.assertEqual(len(catalog["qr_codes"]), 7)
        d, layout = get_derived(CONFIG), get_navigation_layout(CONFIG)
        for edge in catalog["edges"]:
            a, b = [catalog["anchors"][edge[k]] for k in ("from", "to")]
            if a["floor_code"] != b["floor_code"] or a["floor_code"] != "MEZANINO":
                continue
            for i in range(31):
                x = a["position"][0] + (b["position"][0] - a["position"][0]) * i / 30
                y = -a["position"][2] - (b["position"][2] - a["position"][2]) * i / 30
                in_atrium = (
                    abs(x) < CONFIG["mezzanine"]["atrium_opening"] / 2
                    and d["mz_atrium_start_y"] < y < d["mz_atrium_end_y"]
                )
                self.assertTrue(
                    not in_atrium or layout["bridge_start_y"] <= y <= layout["bridge_end_y"], edge
                )

    def test_store_anchors_follow_config_and_clearance(self):
        cfg = copy.deepcopy(CONFIG)
        cfg["store_catalog"][0]["width"] += 0.2
        catalog = build_catalog(cfg)
        derived = get_derived(cfg)
        for code, position in derived["store_positions"].items():
            anchor = catalog["anchors"][catalog["pois"][code]["anchor_code"]]
            self.assertAlmostEqual(abs(anchor["position"][0] - position["vitrine_x"]), 0.6)
            self.assertAlmostEqual(-anchor["position"][2], position["center_y"])


if __name__ == "__main__":
    unittest.main()
