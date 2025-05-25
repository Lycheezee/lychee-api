# Debugging Guide for Lychee Backend

## Automated Debugger Setup

This project includes several debugging configurations that automatically attach the debugger when you run the application.

### Quick Start

1. **Auto-attach (Recommended)**

   - Open VS Code in this workspace
   - Press `Ctrl+Shift+D` to open the Debug panel
   - Select "Launch Server with Auto Debug" from the dropdown
   - Press `F5` or click the green play button
   - The debugger will automatically attach and you can set breakpoints

2. **Using npm scripts**

   ```bash
   # Run with debugger enabled
   npm run dev:debug

   # In another terminal or VS Code, attach to the process
   # Use "Attach to Process" configuration in VS Code
   ```

### Available Debug Configurations

1. **Debug Lychee Backend** - Direct TypeScript debugging
2. **Debug with ts-node-dev** - Uses the dev:debug npm script
3. **Attach to Process** - Attaches to an already running process on port 9229
4. **Auto Attach Debug** - Automatically launches and attaches debugger
5. **Launch Server with Auto Debug** - Compound configuration for easy one-click debugging

### Available npm Scripts

- `npm run dev` - Regular development mode
- `npm run dev:debug` - Development mode with debugger enabled on port 9229
- `npm run debug` - Direct debug mode using ts-node
- `npm run start:debug` - Debug compiled JavaScript

### Setting Breakpoints

1. Open any TypeScript file in the `src` folder
2. Click in the gutter to the left of line numbers to set breakpoints
3. Red dots will appear indicating active breakpoints
4. When the code executes, it will pause at breakpoints

### Debug Features Enabled

- **Auto-attach**: VS Code will automatically attach to Node.js processes
- **Source maps**: Full TypeScript source debugging support
- **Hot reload**: Changes restart the debugger automatically
- **Environment variables**: Loaded from `.env` file
- **Skip node internals**: Focuses on your code, not Node.js internals

### Troubleshooting

1. **Debugger not attaching**:

   - Make sure port 9229 is not in use
   - Try restarting VS Code
   - Check that the process is running with `--inspect` flag

2. **Breakpoints not hitting**:

   - Ensure source maps are enabled
   - Check that the file path matches exactly
   - Try setting breakpoints after the debugger attaches

3. **Environment variables not loading**:
   - Make sure your `.env` file exists in the root directory
   - Check that the `envFile` path is correct in launch.json

### Advanced Usage

For more advanced debugging scenarios, you can modify the configurations in `.vscode/launch.json` to suit your specific needs.
