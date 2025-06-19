<h1 align="center">obsidian-textgenerator-plugin (OpenRouter Fork)</h1>

A fork of the [Obsidian Text Generator](https://github.com/nhaouari/obsidian-textgenerator-plugin) plug-in that adds support for [OpenRouter](https://openrouter.ai/), allowing far more models to be added quickly and easily, without the need for manual adding.

This fork adds support for OpenRouter and has a script to pull the most recent list of models from OpenRouter and automatically add them to the javascript file that contains all of the supported models. The featureset is otherwise the same, so refer to the original documentation for most things.

## Installation

### Method 1: From Obsidian Community Plugins

1. Open Obsidian
2. Go to Settings > Community plugins
3. Turn off Safe mode if it's on
4. Click on "Browse" and search for "BRAT"
5. Click Install and then Enable
6. Withint the "BRAT" extension, add this URL (https://github.com/bgreenawald/obsidian-textgenerator-plugin) and choose the most recent release.

### Method 2: Manual Installation

If you prefer to install the plugin manually or want to use the latest development version:

1. Clone this repository to your Obsidian vault's plugins folder:
   ```bash
   git clone https://github.com/nhaouari/obsidian-textgenerator-plugin.git
   ```

2. Navigate to the plugin directory:
   ```bash
   cd obsidian-textgenerator-plugin
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Build the plugin:
   ```bash
   pnpm run build
   ```

   Alternatively, for development:
   ```bash
   pnpm run dev
   ```


5. Restart Obsidian and enable the plugin in Settings > Community plugins
   
   Alternatively, You can use the [Hot-Reload plugin](https://github.com/pjeby/hot-reload) to reload plugins without restarting Obsidian
