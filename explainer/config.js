// ===========================================================
// explainer — settings for this site.
//
// header.js loads this file on every page, so the chat bubble
// shows up everywhere. Change the text below to change what the
// assistant knows about the site.
// ===========================================================

Explainer.init({
  // Visitors add their own free OpenRouter key with the ⚙️ button in the
  // chat. Their key stays in their browser and is only sent to OpenRouter,
  // so this site needs no server and never sees anyone's key.
  allowUserKey: true,

  // Optional: a proxy that holds YOUR key, so visitors don't need one
  // (see README.md, "Optional: a proxy"). Leave empty to use visitor keys.
  endpoint: "", // e.g. "https://explainer-proxy.<you>.workers.dev"

  // Only used when previewing on localhost (see dev-key.example.js)
  devApiKey: window.EXPLAINER_DEV_KEY,

  // Free OpenRouter models. "openrouter/free" lets OpenRouter pick one.
  model: "openrouter/free",

  // Where the bubble sits: "bottom-right", "bottom-left", "top-right", "top-left"
  position: "bottom-right",
  offset: { x: 20, y: 20 },
  accentColor: "#3d6b4f",

  persona: "plain", // visitors can flip the Sage toggle (a grumpy dragon who only gives hints)
  title: "Ask about this page",

  site: {
    name: "Minahil Faisal",
    description:
      "Personal website and portfolio of Minahil Faisal, a graduate student at Simon Fraser University's School of Interactive Arts & Technology (SIAT). It holds her coursework for IAT 806 and personal projects, mostly interactive sketches made with p5.js and ml5.js.",
    audience:
      "Classmates, instructors, and visitors with no programming background. Explain code and technical terms simply.",
    glossary: {
      "p5.js":
        "a JavaScript library for drawing and making interactive visuals in the browser",
      "ml5.js":
        "a beginner-friendly machine-learning library for the browser, used here for things like hand tracking",
      "IAT 806":
        "a graduate course at SFU on computing for interactive arts and design",
      SIAT: "the School of Interactive Arts & Technology at Simon Fraser University",
      sketch: "a p5.js program; it usually draws on a canvas on the page",
    },
    pages: {
      "/index.html": "Home page: who Minahil is and where to find her work",
      "/projects/index.html": "All projects and courses",
      "/projects/iat-806/index.html": "Every IAT 806 lab and assignment",
      "/projects/iat-806/project/index.html": "The IAT 806 final project: explainer itself, how it was built and how to use it",
      "/projects/task-queue/index.html":
        "To Do List Organizer, a p5.js to-do queue with priorities and calendar views",
      "/projects/bioluminescent-beach/index.html":
        "Bioluminescent Beach, glowing plankton that react to hand tracking (p5.js + ml5.js)",
      "/projects/iat-806/assignment-01/index.html":
        "Assignment 01, Interactive Drawing: a liminal space game",
      "/projects/iat-806/assignment-02/index.html":
        "Assignment 02, Star Catcher: catch falling stars, built with ml5.js",
      "/projects/iat-806/lab-08/index.html": "Lab 08, Bubble Bath",
      "/projects/iat-806/lab-09/index.html": "Lab 09, API Integration",
    },
    notes:
      "Interactive sketches draw on a <canvas>, so the assistant can't see what's drawn; it can explain what the page says about the sketch.",
  },

  starters: [
    "What is this page about?",
    "Explain this project simply",
    "Where should I look next?",
  ],
});
