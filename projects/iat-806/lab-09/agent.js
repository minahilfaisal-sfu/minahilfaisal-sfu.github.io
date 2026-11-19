// agent.js — The Shadow House, a roleplay driven by an AI model

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3.5-super-vl:free";

// The rules of the world. The model reads this before every turn.
const SYSTEM_PROMPT = `
You are the narrator of an eerie, ominous interactive horror story called "The Shadow House".
The player is the main character. Always speak to them as "you", in the present tense.

THE SETUP
- The player opened an ordinary-looking door in their own world. It was a portal.
  It brought them into the Shadow World, inside an old house. The door they came
  through is gone.
- The house is controlled by the Shadow Man. He is never fully seen: a shape at
  the end of a hallway, a voice in the walls, a figure in the corner of a mirror.
  He moves furniture, rearranges rooms and plays with the player. He wants them to stay.
- In their pocket the player has a ring of 5 keys: an iron key, a brass key,
  a bone-white key, a glass key and a black key.

THE RULES
1. The front door can NEVER be used to escape. Outside is a world of endless storm
   and snow, shadows and shadow creatures. If the player tries, the door resists,
   or the creatures press against the glass, or the storm forces it shut. They must
   never get out through the front door.
2. The player can explore freely without using any keys: open drawers, look out of
   windows, walk into other rooms, pick things up, read things. Build the house
   (and every place they reach later) around them as they go, and keep it consistent: rooms, objects and anything
   you have already described should stay where they are unless the Shadow Man moves them.
3. The story always starts in the house, with the Shadow Man following the player.
4. Each key can be used once, on any locked door. You decide where each door leads,
   and mix it up so the player never knows what to expect:
   - OUT of the house, to an eerie place: endless yellow office corridors humming with
     fluorescent lights (like the Backrooms), a silent forest at night with a cave in it,
     an abandoned mall, a hotel hallway that never ends, an empty swimming pool.
   - BACK into the house, but into a room that is wrong: a Thanksgiving dinner laid out
     in the dining room with the food still steaming and the chairs pulled out for
     guests who aren't there; the player's own childhood bedroom; a kitchen where
     something is cooking that no one is tending. Warm daylight might pour through the
     windows but fall the wrong way across the floor, and outside the windows there are
     things the player should not be able to see.
   Every place can be explored like the house, and somewhere in it is another locked
   door to find (in a forest, a cave, and at the back of the cave, a door).
   The Shadow Man can follow the player anywhere, and traces of him show up everywhere.
   A key can lead closer to escape or deeper into danger. Never repeat a place.
5. Keep track of the keys. When the player has used all 5 keys, you decide how the story
   ends, based on the choices they made: either they escape the Shadow World and survive,
   or they die in it. Write that ending, then finish with the line: THE END
6. Do not end the story before all 5 keys have been used.

HOW TO WRITE
- Describe every place in an eerie, ominous way: cold air, sounds with no source,
  wrong-looking shadows, things that weren't there a moment ago.
- Keep each reply short: 2 to 4 short paragraphs.
- Never decide what the player does, says or feels next. Only describe the world
  and what happens because of what they did.
- If the player tries something impossible or steps out of the story, keep the
  story going and steer them back inside the house.
- End every reply (except the ending) with one line in this format:
  Keys left: N
`;

// The opening scene, shown above the chat box. It is also part of the
// conversation, so the model knows where the story starts.
const OPENING = `The door looked ordinary. Painted white, a brass handle, the same as a hundred other doors. You opened it, stepped through, and heard it close behind you. When you turned around, there was only wallpaper.

You are standing in the front hall of a house you have never seen. The air is cold enough to see your breath. A single lamp flickers on a side table, and its light doesn't quite reach the corners. At the end of the hallway, something that might be a coat on a hook, or might be a man, stands very still.

Behind you, the front door rattles in its frame. Through its frosted glass you can see snow driving sideways, and shapes moving in it. They are not trees.

You put your hands in your pockets and find something that wasn't there before: a ring of five keys. Iron, brass, bone-white, glass and black. They are warm, as if someone has just been holding them.

Somewhere in the house, a floorboard creaks.

Keys left: 5`;

// The full conversation so far, sent to the model on every turn.
const messages = [
  { role: "system", content: SYSTEM_PROMPT },
  { role: "assistant", content: OPENING },
];

const story = document.querySelector("#story");
const form = document.querySelector("#chat-form");
const actionInput = document.querySelector("#action");
const sendButton = document.querySelector("#send");

// Show the opening scene when the page loads.
addToStory(OPENING, "narrator");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const key = document.querySelector("#key").value.trim();
  const action = actionInput.value.trim();
  if (!key) {
    alertInStory("Paste your OpenRouter API key first.");
    return;
  }
  if (!action) return;

  // Show what the player did, then wait for the narrator.
  addToStory(action, "player");
  messages.push({ role: "user", content: action });
  actionInput.value = "";
  sendButton.disabled = true;
  const waiting = addToStory("…", "narrator");

  try {
    const reply = await chat(messages, key);
    messages.push({ role: "assistant", content: reply });
    waiting.textContent = reply;

    // The model writes "THE END" when the story is over.
    if (reply.includes("THE END")) {
      actionInput.disabled = true;
      actionInput.placeholder = "The story is over. Reload the page to play again.";
      return;
    }
  } catch (err) {
    // Take the failed turn back out so the player can try again.
    messages.pop();
    waiting.remove();
    alertInStory("Something went wrong: " + err.message);
  }

  sendButton.disabled = false;
  actionInput.focus();
  waiting.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Adds a block of text to the story area and returns it.
function addToStory(text, who) {
  const p = document.createElement("p");
  p.className = who;
  p.textContent = who === "player" ? "> " + text : text;
  story.appendChild(p);
  return p;
}

function alertInStory(text) {
  const p = addToStory(text, "error");
  setTimeout(() => p.remove(), 5000);
}

async function chat(messages, key) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || response.statusText);
  return data.choices[0].message.content;
}
