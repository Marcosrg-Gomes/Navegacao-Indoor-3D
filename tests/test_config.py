"""Testes de configurações, sem depender de bpy."""

from copy import deepcopy
import unittest

from config import CONFIG, get_derived, validate_config


class ConfigTests(unittest.TestCase):
    def test_default_config_is_valid(self):
        validate_config(CONFIG)
        derived = get_derived(CONFIG)
        self.assertEqual(len(derived["store_positions"]), 22)
        self.assertGreater(derived["mz_walkway_width"], 0)

    def test_duplicate_store_code_is_rejected(self):
        config = deepcopy(CONFIG)
        config["store_catalog"].append(deepcopy(config["store_catalog"][0]))
        with self.assertRaisesRegex(ValueError, "duplicados"):
            get_derived(config)

    def test_invalid_atrium_is_rejected(self):
        config = deepcopy(CONFIG)
        config["mezzanine"]["atrium_opening"] = config["corridor"]["width"]
        with self.assertRaisesRegex(ValueError, "átrio"):
            get_derived(config)

    def test_store_depth_cannot_cross_external_wall(self):
        config = deepcopy(CONFIG)
        config["store_catalog"][0]["depth"] = 100
        with self.assertRaisesRegex(ValueError, "profundidade"):
            get_derived(config)
