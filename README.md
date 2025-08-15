# DrakonTech

A flowchart editor that generates prompts for AI apps and source code in Clojure and JavaScript.

[DrakonTech's homepage](https://drakon.tech/)

![DrakonTech screenshot: FizzBuzz algorithm](assets/drakontech-screenshot.png)

DrakonTech is a flowchart editor that generates pseudocode for AI app prompts and source code in Clojure and JavaScript.
In other words, DrakonTech is a prompt-engineering tool and an IDE for JavaScript and Clojure. DrakonTech utilizes the DRAKON standard from the aerospace industry. DRAKON’s strict ergonomic rules ensure algorithms are easy to read, while DrakonTech streamlines flowchart creation and modification with minimal user input.

## About DrakonTech

DrakonTech enables users to build algorithms using DRAKON, a flowchart standard designed for clarity and precision. The editor automates flowchart construction with just a few clicks, transforming them into pseudocode for AI applications like ChatGPT, Gemini, or Grok, or directly into Clojure and JavaScript source code.

## Features

- **Ergonomic Flowcharts**: Create algorithms with DRAKON’s clear, readable structure.
- **Pseudocode Generation**: Convert flowcharts into pseudocode for AI app prompts.
- **Clojure and JavaScript Output**: Generate functional code directly from flowcharts.

## Why Use DrakonTech for AI-Aided Software Development

For many real-life algorithms, a text-only description is insufficient to specify program logic clearly. Pseudocode provides a structured way to communicate a program’s intent to an AI app, but it can be difficult to read. With DrakonTech, users create intuitive flowcharts that are easy to understand and then generate precise pseudocode, accurately conveying the programmer’s intention to AI applications.


## Generating Pseudocode for AI Apps

1. Create an empty folder and add a `solution.json` file with:
   ```json
   {
       "language": "LANG_HUMAN"
   }
   ```
2. Start DrakonTech, click "Open folder," and select the created folder.
3. Create functions, adding human-friendly free text inside flowchart elements.
4. Click the "Build" button (spanner icon) to generate pseudocode:
   - For a single function, open the function and click "Build."
   - For all functions in a folder and its subfolders, select the folder in the tree view and click "Build."
5. Use the generated pseudocode as a prompt for AI apps.

*Example*: DrakonTech’s own source code includes an AI-targeted project as a practical demonstration.

https://github.com/stepan-mitkin/drakon.tech.desktop/tree/main/src/extro/clojure/clojure-lexer

## Generating Clojure Source Code

1. Create an empty folder and add a `solution.json` file with:
   ```json
   {
       "language": "clojure",
       "outputFile": "../foo-bar.cljc" // Optional
   }
   ```
2. Start DrakonTech, click "Open folder," and select the created folder.
3. Create functions, embedding small Clojure snippets in flowchart elements.
4. Use the "Question" icon without round brackets, e.g., `= x 0` produces `(= x 0)`.
5. Declare variables in "Action" icons using `let`, e.g.:
   ```clojure
   let y 10
   ```
   or
   ```clojure
   let y 10
       z (+ y 5)
   ```
   This produces:
   ```clojure
   (let [y 10 z (+ y 5)]
       (... rest of your function))
   ```
   Note: Omit square brackets and the `let` body; declared variables are available in the flowchart below the icon.
6. Add a `module` function at the root folder to include custom code at the top of the generated module.
7. Click the "Build" button to generate a Clojure module.
8. The generated file is placed in the project folder by default or at the path specified in `outputFile` (relative or absolute, using `..` for relative paths).

See example:

https://github.com/stepan-mitkin/drakon.tech.desktop/tree/main/demos/hello-drakon-clojure

## Generating JavaScript Source Code

1. Create an empty folder and add an optional `solution.json` file with:
   ```json
   {
       "language": "JS",
       "outputFile": "../foobar.js" // Optional
   }
   ```
2. Start DrakonTech, click "Open folder," and select the created folder.
3. Create functions, embedding small JavaScript snippets in flowchart elements.
4. Add a `module` function at the root folder to include custom code at the top of the generated module.
5. Click the "Build" button to generate a JavaScript module.
6. The generated file is placed in the project folder by default or at the path specified in `outputFile` (relative or absolute, using `..` for relative paths).

See examples:

https://github.com/stepan-mitkin/drakon.tech.desktop/tree/main/demos/fsm-lift

https://github.com/stepan-mitkin/drakon.tech.desktop/tree/main/demos/linkedlist


## Get DrakonTech

DrakonTech is available for __Windows__, __macOS__, and __Linux__.

- [Run DrakonTech in the browser](https://stepan-mitkin.github.io/drakon.tech.desktop/run)
- [Download DrakonTech from GitHub releases](https://github.com/stepan-mitkin/drakon.tech.desktop/releases/)
