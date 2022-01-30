# Contribution Guidelines

The easiest way to contribute to this project is to fork the [repository](https://github.com/danieldietrich/candid) on GitHub.

Then open it in [Gitpod](https://gitpod.io/). The `.gitpod.yml` file defines how the project is configured.

Alternatively, you can clone the repository locally, `npm install` the dependencies and open it in your favorite editor.

## Project structure

The project basically consists of two main parts:

* `src/index.js`: the main library
* `index.html`: the main web page (uses static assets located in `public/`)

## Building

The project is built using [vite](https://vitejs.dev).

* Run `npm run dev` to start the development server http://localhost:3000
* Run `npm run build:docs` to bundle the documentation to `docs/`
* Run `npm run build:lib` to bundle the library to `dist/`

The documentation is automatically built and deployed by `.github/workflows/build-and-deploy.yml` on each push or pull request to main.