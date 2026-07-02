// Week 1 - OpenClaw Architecture Fundamentals

// A simple tool that returns the current time
export async function getCurrentTime() {
  return { currentTime: new Date().toISOString() };
}

// A simple tool that returns a welcome message
export async function getWelcome() {
  return { message: "Welcome to IDX Exchange AI Assistant!" };
}

// The main message handler - routes messages to the right tool
export async function handleMessage(message: string) {
  
  // if the user asks about time, return the time
  if (message.toLowerCase().includes("time")) {
    return await getCurrentTime();
  }
  
  // if the user says hello, return a welcome message
  if (message.toLowerCase().includes("hello") || 
      message.toLowerCase().includes("hi")) {
    return await getWelcome();
  // if we don't understand, say so
  return { response: "I could not understand the request. Try saying 'hello' or 'what time is it'" };
}


// Test our functions
async function main() {
  console.log(await handleMessage("hello"));
  console.log(await handleMessage("what time is it"));
  console.log(await handleMessage("find me a house"));
}

main();