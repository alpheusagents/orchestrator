import { defineConfig } from "@apst/oxlint";
import { commonPreset } from "@apst/oxlint/presets/common";
import { jsxPreset } from "@apst/oxlint/presets/jsx";
import { nodePreset } from "@apst/oxlint/presets/node";
import { reactPreset } from "@apst/oxlint/presets/react";

export default defineConfig(
    {
        options: {
            typeAware: true,
            typeCheck: true,
        },
    },
    [
        // Common
        commonPreset(),
        nodePreset(),
        // React
        jsxPreset(),
        reactPreset(),
    ],
);
