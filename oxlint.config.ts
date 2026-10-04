import { defineConfig } from "@apst/oxlint";
import { commonPreset } from "@apst/oxlint/presets/common";
import { nodePreset } from "@apst/oxlint/presets/node";

export default defineConfig(
    {
        options: {
            typeAware: true,
            typeCheck: true,
        },
    },
    [
        // Foundation
        commonPreset(),
        // Environment
        nodePreset(),
    ],
);
