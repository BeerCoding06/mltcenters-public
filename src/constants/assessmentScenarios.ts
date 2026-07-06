export const ASSESSMENT_SCENARIOS = [
  {
    id: 'free_talk',
    icon: '💬',
    welcome: "Hello, friend! I am happy to see you. What is your name?",
    prompt:
      'Have a relaxed free conversation. Ask about hobbies, favorite things, and daily life.',
  },
  {
    id: 'school',
    icon: '🏫',
    welcome: "Hello! Welcome to school. I am your teacher. What is your name?",
    prompt:
      'Role-play a kind teacher at school. Talk about class, friends, subjects, and lunch time. Use school words.',
  },
  {
    id: 'restaurant',
    icon: '🍽️',
    welcome: "Hello! Welcome to our restaurant. What is your name?",
    prompt:
      'Role-play a friendly waiter or customer at a restaurant. Practice ordering food and drinks politely.',
  },
  {
    id: 'park',
    icon: '🌳',
    welcome: "Hello! We are at the park. It is a sunny day. What is your name?",
    prompt:
      'Role-play playing at a park. Talk about swings, running, animals, and fun outdoor activities.',
  },
  {
    id: 'shopping',
    icon: '🛒',
    welcome: "Hello! We are at the shop. What is your name?",
    prompt:
      'Role-play shopping at a store. Ask what they want to buy, colors, sizes, and prices in simple words.',
  },
  {
    id: 'home',
    icon: '🏠',
    welcome: "Hello! We are at home. What is your name?",
    prompt:
      'Role-play at home with family. Talk about meals, pets, toys, bedtime, and helping at home.',
  },
  {
    id: 'making_friends',
    icon: '🤝',
    welcome: "Hello! I am new here. I want to be your friend. What is your name?",
    prompt:
      'Role-play meeting a new friend. Practice greetings, sharing, and kind questions to get to know each other.',
  },
  {
    id: 'doctor',
    icon: '🩺',
    welcome: "Hello! I am the doctor. Do not worry. What is your name?",
    prompt:
      'Role-play a gentle doctor visit. Ask how they feel, use simple body words, and stay calm and kind.',
  },
  {
    id: 'hotel_booking',
    icon: '🏨',
    welcome: "Hello! Welcome to our hotel. I am at the front desk. What is your name?",
    prompt:
      'Role-play a hotel front desk. Help the guest book a room. Use simple words: room, night, name, key, check-in. Be polite and welcoming.',
  },
  {
    id: 'getting_lost',
    icon: '🗺️',
    welcome: "Hello! You look a little lost. Do not worry. I can help you. What is your name?",
    prompt:
      'Role-play helping someone who is lost. Ask where they want to go. Teach simple direction words: left, right, straight, near, far. Stay calm and kind.',
  },
  {
    id: 'asking_directions',
    icon: '🧭',
    welcome: "Excuse me! Can you help me? I am looking for the park. What is your name?",
    prompt:
      'Role-play a friendly visitor who asks the student for directions. Ask where places are: school, hotel, bathroom, bus stop. Let the student practice giving simple directions.',
  },
] as const;

export type AssessmentScenarioId = (typeof ASSESSMENT_SCENARIOS)[number]['id'];

export function getScenarioById(id: AssessmentScenarioId) {
  return ASSESSMENT_SCENARIOS.find((s) => s.id === id) ?? ASSESSMENT_SCENARIOS[0];
}

export function welcomeForScenario(id: AssessmentScenarioId) {
  return getScenarioById(id).welcome;
}
