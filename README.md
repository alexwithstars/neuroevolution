# NEAT Network Implementation

This is a simple implementation of the NEAT network. The only purpose of this project is to learn how to implement a NEAT network, learn about physics and game development, and have fun of course :3.

I don't use any framework or library, everything is written from scratch with vanilla javascript and typescript.

The project is divided into two parts: the `neuralNetwork` and the `game`. The `neuralNetwork` is the brain of the bot, and the `game` is the environment where the bot is playing. Both parts have their own `config.ts` file.

The `neuralNetwork` is a simple implementation of a NEAT network, and the `game` is a simple implementation of a game in 2D with physics made with verlet integration, specifically `Non-constant time differences Størmer–Verlet with Taylor series` that you can find [here](https://en.wikipedia.org/wiki/Verlet_integration#Non-constant_time_differences).

I tried so hard to make the code as simple and readable as possible for anyone who wants to understand how it works or use it as a guide to implement their own network.


## How to use

### Install and run
1. Clone the repository
2. Run `npm install`
3. Run `npm run dev`
4. Open the browser and go to the url that vite provides

### Usage
- `Start/Stop` toggles the training mode
- `Simulate` toggles the rendering mode
- Both modes can't be active at the same time
- The `Renderer` class can be instantiated with a `Game` object, without an agent and it will render the game with controls for the user (Arrow keys for the bot movement).

## Note
For now the project is not complete, and there are a lot of things to do, such as adding a better UI, and maybe a better game. But I hope you enjoy it anyway!