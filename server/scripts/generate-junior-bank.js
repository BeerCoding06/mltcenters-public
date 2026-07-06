/**
 * Generate ~200 creative English MCQ for runner game (ages 10-15).
 * Run: node server/scripts/generate-junior-bank.js
 */
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { attachImageToQuestion } from '../lib/question-images.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../data/questions_junior.json');

function q(question, correct, wrong1, wrong2, explanation) {
  return { question, options: [correct, wrong1, wrong2], correct_index: 0, explanation, band: 'junior' };
}

function qRot(question, a, b, c, correctIndex, explanation) {
  return { question, options: [a, b, c], correct_index: correctIndex, explanation, band: 'junior' };
}

const bank = [];

// Grammar & verbs (35)
const verbs = [
  ['She ___ to music every day.', 'listens', 'listen', 'listening', 'Use listens with she.'],
  ['They ___ football after school.', 'play', 'plays', 'playing', 'They play — no -s.'],
  ['I ___ my homework yesterday.', 'finished', 'finish', 'finishing', 'Yesterday → past tense.'],
  ['He ___ not like spicy food.', 'does', 'do', 'did', 'He does not like.'],
  ['We ___ going to the museum tomorrow.', 'are', 'is', 'am', 'We are going.'],
  ['The cat ___ on the sofa now.', 'is sleeping', 'sleep', 'sleeps', 'Now → present continuous.'],
  ['Birds ___ in the sky.', 'fly', 'flies', 'flying', 'Birds fly.'],
  ['She has ___ finished her project.', 'already', 'yet', 'never', 'Already = before now.'],
  ['I have ___ been to Japan.', 'never', 'ever', 'always', 'Never = not at any time.'],
  ['If it rains, we ___ stay inside.', 'will', 'would', 'was', 'First conditional: will.'],
];
verbs.forEach(([question, ...rest]) => bank.push(q(question, ...rest)));

bank.push(q('Choose the correct sentence.', 'She is taller than me.', 'She more tall than me.', 'She tallest than me.', 'Comparative: taller than.'));
bank.push(q('Past of "go"?', 'went', 'goed', 'gone', 'Irregular past: went.'));
bank.push(q('Past of "eat"?', 'ate', 'eated', 'eating', 'Irregular past: ate.'));
bank.push(q('Plural of "child"?', 'children', 'childs', 'childes', 'Children is the plural.'));
bank.push(q('Which is correct?', "I don't have any money.", "I don't have some money.", 'I not have money.', "Use don't + base verb."));

// Vocabulary & word power (40)
const vocab = [
  ['Something you use to cut paper:', 'scissors', 'spoon', 'pillow', 'Scissors cut paper.'],
  ['A person who fixes teeth:', 'dentist', 'pilot', 'farmer', 'A dentist fixes teeth.'],
  ['The study of stars and planets:', 'astronomy', 'biology', 'history', 'Astronomy is space science.'],
  ['Very, very small — invisible to the eye:', 'microscopic', 'gigantic', 'colorful', 'Microscopic means tiny.'],
  ['To save something for later use:', 'store', 'destroy', 'ignore', 'Store means keep for later.'],
  ['A long trip by ship:', 'voyage', 'snack', 'whisper', 'A voyage is a long journey.'],
  ['Feeling nervous before a test:', 'anxious', 'hungry', 'sleepy', 'Anxious means worried.'],
  ['The ability to understand others\' feelings:', 'empathy', 'gravity', 'electricity', 'Empathy is understanding feelings.'],
  ['Opposite of "generous":', 'selfish', 'kind', 'brave', 'Selfish is the opposite.'],
  ['A book that tells a made-up story:', 'novel', 'dictionary', 'calendar', 'A novel is fiction.'],
  ['Water that falls from clouds:', 'rain', 'sand', 'smoke', 'Rain falls from clouds.'],
  ['A place where you borrow books:', 'library', 'bakery', 'stadium', 'Libraries lend books.'],
  ['Energy from the sun:', 'solar', 'lunar', 'metal', 'Solar means from the sun.'],
  ['To make something better:', 'improve', 'worsen', 'forget', 'Improve means make better.'],
  ['A group of musicians playing together:', 'orchestra', 'audience', 'recipe', 'An orchestra plays music.'],
  ['Careful use of water and electricity:', 'conservation', 'pollution', 'competition', 'Conservation protects resources.'],
  ['A story passed down for many years:', 'legend', 'receipt', 'ticket', 'Legends are old stories.'],
  ['To find a solution to a problem:', 'solve', 'create', 'hide', 'Solve a problem.'],
  ['Something that is not true:', 'false', 'real', 'certain', 'False means not true.'],
  ['Full of energy and excitement:', 'enthusiastic', 'boring', 'silent', 'Enthusiastic means eager.'],
];
vocab.forEach(([question, ...rest]) => bank.push(q(question, ...rest)));

// Science & curiosity (25)
const science = [
  ['Plants make food using sunlight. This is called ___', 'photosynthesis', 'recycling', 'digestion', 'Plants use photosynthesis.'],
  ['The center of our solar system is the ___', 'Sun', 'Moon', 'Mars', 'The Sun is the center.'],
  ['Water freezes at zero degrees ___', 'Celsius', 'colors', 'meters', 'Water freezes at 0°C.'],
  ['The human body has 206 ___', 'bones', 'stars', 'oceans', 'Adults have 206 bones.'],
  ['Electricity needs a complete ___ to flow.', 'circuit', 'circle', 'season', 'Electricity flows in a circuit.'],
  ['Dinosaurs lived millions of years ___', 'ago', 'ahead', 'above', 'Ago means in the past.'],
  ['A caterpillar becomes a ___', 'butterfly', 'fish', 'rock', 'Metamorphosis: butterfly.'],
  ['The force that pulls objects down:', 'gravity', 'music', 'color', 'Gravity pulls things down.'],
  ['Oxygen is a ___ we breathe.', 'gas', 'solid', 'liquid', 'Oxygen is a gas.'],
  ['Recycling helps reduce ___', 'pollution', 'homework', 'sleep', 'Recycling reduces pollution.'],
  ['The brain controls your ___', 'body', 'shoes', 'clouds', 'The brain controls the body.'],
  ['Volcanoes can erupt hot ___', 'lava', 'ice', 'cotton', 'Lava comes from volcanoes.'],
  ['The Moon orbits the ___', 'Earth', 'Mars', 'Jupiter', 'The Moon orbits Earth.'],
];
science.forEach(([question, ...rest]) => bank.push(q(question, ...rest)));

// Logic, riddles & creative thinking (30)
const riddles = [
  ['I have keys but no locks. I have space but no room. What am I?', 'keyboard', 'piano only', 'door', 'A keyboard has keys.'],
  ['What gets wetter the more it dries?', 'towel', 'river', 'sun', 'A towel dries you and gets wet.'],
  ['If you have me, you want to share me. If you share me, you lose me. What am I?', 'secret', 'pizza', 'book', 'Secrets are lost when shared.'],
  ['What has hands but cannot clap?', 'clock', 'robot', 'tree', 'A clock has hands.'],
  ['Which word is a palindrome? (reads same backward)', 'level', 'happy', 'jump', 'LEVEL reads same both ways.'],
  ['Complete: Practice makes ___', 'perfect', 'tired', 'hungry', 'Practice makes perfect.'],
  ['Which does not belong? apple, banana, carrot, grape', 'carrot', 'apple', 'banana', 'Carrot is a vegetable.'],
  ['Synonym of "brave":', 'courageous', 'lazy', 'quiet', 'Courageous means brave.'],
  ['Antonym of "ancient":', 'modern', 'old', 'historic', 'Modern is opposite of ancient.'],
  ['If 3 cats catch 3 mice in 3 minutes, how many cats for 100 mice in 100 minutes?', '3', '100', '1', 'Still 3 cats — same rate.'],
  ['A map helps you find your ___', 'way', 'food', 'sleep', 'Maps show directions.'],
  ['Brainstorm means think of many ___', 'ideas', 'apples', 'shoes', 'Brainstorm = many ideas.'],
  ['Which is a renewable resource?', 'solar energy', 'coal', 'oil', 'Solar energy renews.'],
  ['Teamwork means working ___', 'together', 'alone', 'slowly', 'Together as a team.'],
  ['A goal is something you want to ___', 'achieve', 'forget', 'break', 'Achieve your goals.'],
];
riddles.forEach(([question, ...rest]) => bank.push(q(question, ...rest)));

// Daily life, school & culture (35)
const daily = [
  ['You should ___ "please" when asking for help.', 'say', 'eat', 'draw', 'Say please politely.'],
  ['A passport is needed for international ___', 'travel', 'sleep', 'cooking', 'Travel abroad needs a passport.'],
  ['Recycling paper saves ___', 'trees', 'money only', 'phones', 'Paper comes from trees.'],
  ['A healthy diet includes fruits and ___', 'vegetables', 'candy only', 'soda only', 'Eat vegetables too.'],
  ['Exercise keeps your body ___', 'healthy', 'lazy', 'sad', 'Exercise helps health.'],
  ['Cyberbullying happens ___', 'online', 'in space', 'underwater', 'Online on the internet.'],
  ['A resume lists your skills and ___', 'experience', 'pets', 'games', 'Resumes show experience.'],
  ['Democracy means people can ___', 'vote', 'fly', 'sleep', 'Citizens vote in democracy.'],
  ['An interview is a meeting for a ___', 'job', 'meal', 'nap', 'Jobs use interviews.'],
  ['Budget means a plan for spending ___', 'money', 'time only', 'clouds', 'Budget your money.'],
  ['Volunteering means helping without ___', 'payment', 'friends', 'books', 'Volunteers work for free.'],
  ['A documentary is a ___ film about real life.', 'non-fiction', 'cartoon', 'comedy only', 'Documentaries are real.'],
  ['Culture includes food, music, and ___', 'traditions', 'gravity', 'math', 'Traditions are cultural.'],
  ['To apologize means to say ___', 'sorry', 'hello', 'goodbye', 'Sorry shows apology.'],
  ['A debate is a discussion with different ___', 'opinions', 'colors', 'animals', 'People share opinions.'],
  ['Time management helps you use ___ wisely.', 'time', 'water', 'sand', 'Manage your time.'],
  ['A mentor is someone who ___ you.', 'guides', 'ignores', 'hurts', 'Mentors guide learners.'],
  ['Critical thinking means thinking ___', 'carefully', 'quickly only', 'never', 'Think carefully and deeply.'],
  ['Biodiversity means many kinds of ___', 'life', 'rocks', 'cars', 'Many species = biodiversity.'],
  ['A hypothesis is a scientific ___', 'guess', 'fact', 'law', 'Scientists test hypotheses.'],
];
daily.forEach(([question, ...rest]) => bank.push(q(question, ...rest)));

// Reading & prepositions (25)
const reading = [
  ['The book is ___ the table.', 'on', 'in', 'at', 'On top of the table.'],
  ['She arrived ___ 8 o\'clock.', 'at', 'on', 'in', 'At + time.'],
  ['We live ___ Bangkok.', 'in', 'on', 'at', 'In + city.'],
  ['He is good ___ math.', 'at', 'in', 'on', 'Good at a subject.'],
  ['I\'m interested ___ science.', 'in', 'on', 'at', 'Interested in something.'],
  ['Turn left ___ the traffic light.', 'at', 'in', 'on', 'At a specific place.'],
  ['She walked ___ the bridge.', 'across', 'under', 'behind', 'Across = from one side to other.'],
  ['The cat hid ___ the bed.', 'under', 'over', 'through', 'Under the bed.'],
  ['We talked ___ our favorite movies.', 'about', 'at', 'in', 'Talk about a topic.'],
  ['This gift is ___ you.', 'for', 'at', 'on', 'A gift for someone.'],
  ['Main idea: "Dogs need exercise daily." Best title?', 'Healthy Dogs', 'Cooking Tips', 'Space Travel', 'Matches exercise for dogs.'],
  ['Which word best completes: "Although it rained, we ___ fun."', 'had', 'have', 'having', 'Although + past story: had.'],
  ['"Quick" and "fast" are ___', 'similar', 'opposites', 'unrelated', 'They mean nearly the same.'],
  ['"Increase" is opposite of ___', 'decrease', 'grow', 'rise', 'Decrease is opposite.'],
];
reading.forEach(([question, ...rest]) => bank.push(q(question, ...rest)));

// Fill to 200 with mixed creative items
const extra = [
  q('Which invention lets you talk to people far away?', 'telephone', 'bicycle', 'pillow', 'Phones connect distant people.'),
  q('A marathon is a long ___ race.', 'running', 'swimming only', 'sleeping', 'Marathons are 42 km runs.'),
  q('Composer writes ___', 'music', 'buildings', 'clothes', 'Composers create music.'),
  q('Archaeologists study ___', 'ancient things', 'future only', 'clouds', 'They dig up history.'),
  q('Ecosystem includes plants, animals, and ___', 'environment', 'phones', 'shoes', 'All living things together.'),
  q('What does "eco-friendly" mean?', 'good for Earth', 'very fast', 'very loud', 'Eco-friendly helps nature.'),
  q('A journalist writes ___', 'news', 'recipes only', 'maps only', 'Journalists report news.'),
  q('Inflation means prices go ___', 'up', 'down', 'away', 'Inflation raises prices.'),
  q('A contract is a written ___', 'agreement', 'song', 'game', 'Contracts are agreements.'),
  q('Philosophy asks big ___ about life.', 'questions', 'sandwiches', 'trains', 'Philosophy explores ideas.'),
  q('Which is renewable energy?', 'wind power', 'plastic', 'coal', 'Wind keeps blowing.'),
  q('A curator works in a ___', 'museum', 'farm', 'kitchen', 'Curators care for exhibits.'),
  q('Metaphor compares two things ___', 'without like', 'with numbers', 'with colors', 'Metaphor says A is B.'),
  q('Simile uses "like" or "___"', 'as', 'the', 'very', 'As brave as a lion.'),
  q('A protagonist is the main ___', 'character', 'villain', 'setting', 'Hero or main character.'),
  q('Setting in a story is time and ___', 'place', 'food', 'shoe', 'Where and when.'),
  q('Climax is the most ___ part of a story.', 'exciting', 'boring', 'short', 'The peak moment.'),
  q('Editing means fixing ___ in writing.', 'mistakes', 'colors', 'shoes', 'Edit to improve text.'),
  q('A thesaurus gives ___', 'synonyms', 'maps', 'recipes', 'Words with similar meaning.'),
  q('A bibliography lists ___', 'sources', 'games', 'pets', 'Books and sources used.'),
  q('Statistics uses ___ to describe data.', 'numbers', 'paint', 'music', 'Data as numbers.'),
  q('Probability measures how ___ something is.', 'likely', 'heavy', 'sweet', 'Chance something happens.'),
  q('Geometry studies shapes and ___', 'angles', 'songs', 'recipes', 'Math of shapes.'),
  q('Algebra uses ___ to stand for numbers.', 'letters', 'colors', 'animals', 'Like x and y.'),
  q('A habitat is where an animal ___', 'lives', 'shops', 'drives', 'Natural home.'),
  q('Migration is when animals ___ seasonally.', 'travel', 'sleep', 'cook', 'Birds migrate south.'),
  q('Camouflage helps animals ___', 'hide', 'sing', 'fly faster', 'Blend into surroundings.'),
  q('A food chain shows who eats ___', 'whom', 'clouds', 'music', 'Energy flow in nature.'),
  q('Deforestation means cutting down ___', 'forests', 'water', 'sky', 'Trees removed.'),
  q('Carbon footprint measures pollution from your ___', 'lifestyle', 'hair', 'shoes', 'Your daily impact.'),
];
bank.push(...extra);

// More creative learning (fill to 200+)
const more = [
  q('A synonym for "enormous" is ___', 'huge', 'tiny', 'quiet', 'Huge means very big.'),
  q('An antonym for "borrow" is ___', 'lend', 'take', 'keep', 'Lend is the opposite.'),
  q('Which sentence is future tense?', 'I will visit grandma.', 'I visit grandma.', 'I visited grandma.', 'Will + verb = future.'),
  q('The capital of Thailand is ___', 'Bangkok', 'London', 'Paris', 'Bangkok is the capital.'),
  q('Photosynthesis happens in ___', 'plants', 'rocks', 'cars', 'Plants make food from light.'),
  q('A decade is ___ years.', '10', '5', '100', 'Decade = 10 years.'),
  q('A century is ___ years.', '100', '10', '1000', 'Century = 100 years.'),
  q('The largest ocean is the ___', 'Pacific', 'Arctic', 'Indian only', 'Pacific is largest.'),
  q('H2O is the chemical name for ___', 'water', 'air', 'gold', 'H2O is water.'),
  q('Which planet is known as the Red Planet?', 'Mars', 'Venus', 'Jupiter', 'Mars looks red.'),
  q('A biography tells the story of a real ___', 'person', 'planet', 'recipe', 'Biographies are about people.'),
  q('Autobiography means you write about ___', 'yourself', 'aliens', 'cars', 'Auto = self.'),
  q('A prefix meaning "not" is ___', 'un-', 're-', 'pre-', 'Unhappy = not happy.'),
  q('Re- in "recycle" means ___', 'again', 'never', 'under', 'Recycle = use again.'),
  q('Which is an adjective?', 'beautiful', 'beauty', 'beautify', 'Beautiful describes nouns.'),
  q('Which is a noun?', 'happiness', 'happy', 'happily', 'Happiness is a thing/idea.'),
  q('Which is an adverb?', 'quickly', 'quick', 'quicken', 'Quickly describes verbs.'),
  q('Active voice: "The dog chased the ball." Passive?', 'The ball was chased by the dog.', 'The ball chased the dog.', 'Chased the ball dog.', 'Ball receives the action.'),
  q('A conclusion sums up the main ___', 'ideas', 'colors', 'shoes', 'End of an essay.'),
  q('A topic sentence starts a ___', 'paragraph', 'song', 'game', 'First sentence of paragraph.'),
  q('Plagiarism means copying without ___', 'credit', 'effort', 'paper', 'Give credit to sources.'),
  q('A podcast is like a radio show ___', 'online', 'underwater', 'in space', 'Podcasts stream online.'),
  q('Coding means writing instructions for a ___', 'computer', 'tree', 'shoe', 'Programs run on computers.'),
  q('An algorithm is a step-by-step ___', 'plan', 'color', 'animal', 'Like a recipe for solving.'),
  q('Artificial intelligence tries to mimic human ___', 'thinking', 'eating', 'sleeping', 'AI learns patterns.'),
  q('Sustainable means able to continue without harm to ___', 'nature', 'phones', 'games', 'Long-term eco balance.'),
  q('A refugee leaves home because of danger or ___', 'war', 'fun', 'parties', 'Seek safety elsewhere.'),
  q('Human rights belong to every ___', 'person', 'building', 'car', 'Rights for all humans.'),
  q('A constitution is basic laws of a ___', 'country', 'kitchen', 'garden', 'Founding rules of nation.'),
  q('Inflation makes things cost ___', 'more', 'less', 'nothing', 'Prices rise.'),
  q('A entrepreneur starts a new ___', 'business', 'planet', 'song', 'Entrepreneurs create companies.'),
  q('Innovation means a new idea or ___', 'invention', 'sleep', 'rain', 'Something new and useful.'),
  q('Collaboration means working with ___', 'others', 'nobody', 'walls', 'Team collaboration.'),
  q('Resilience means bouncing back after ___', 'difficulty', 'lunch', 'music', 'Recover from hard times.'),
  q('Mindfulness means paying attention to the ___', 'present', 'past only', 'future only', 'Focus on now.'),
  q('Which is a compound word?', 'sunflower', 'sun', 'flower', 'Sun + flower combined.'),
  q('Which word has a silent letter?', 'knight', 'night only same', 'light', 'Knight has silent k.'),
  q('Homophones sound the same: their, there, and ___', "they're", 'where', 'when', "They're = they are."),
  q('A fable often teaches a ___', 'lesson', 'recipe', 'map', 'Moral at the end.'),
  q('Irony is when the opposite of what you expect ___', 'happens', 'sleeps', 'eats', 'Unexpected outcome.'),
  q('Satire uses humor to criticize ___', 'society', 'gravity', 'math', 'Social commentary.'),
  q('A stanza is a group of lines in a ___', 'poem', 'novel', 'map', 'Poetry sections.'),
  q('Rhyme scheme helps poems ___', 'flow', 'cook', 'drive', 'Pattern of rhymes.'),
  q('Onomatopoeia: "buzz" sounds like a ___', 'bee', 'cat', 'fish', 'Buzz mimics bees.'),
  q('Personification gives human traits to non-human ___', 'things', 'numbers', 'years', 'The wind whispered.'),
  q('A flashback shows an earlier ___', 'event', 'meal', 'shoe', 'Past scene in story.'),
  q('Foreshadowing hints at future ___', 'events', 'colors', 'food', 'Clues about what comes.'),
  q('A protagonist faces a ___', 'conflict', 'sandwich', 'nap', 'Problem to solve.'),
  q('Resolution is when the conflict is ___', 'solved', 'started', 'ignored', 'Story ending.'),
  q('Genre of Harry Potter: fantasy and ___', 'adventure', 'cookbook', 'manual', 'Magic adventure story.'),
  q('Non-fiction is based on ___ facts.', 'real', 'fake', 'imaginary', 'True information.'),
  q('A citation tells where you found ___', 'information', 'shoes', 'food', 'Source reference.'),
  q('Peer review means other experts check your ___', 'work', 'lunch', 'games', 'Quality control in science.'),
  q('A variable in science is something that ___', 'changes', 'never moves', 'disappears', 'Independent variable.'),
  q('A control group is used for ___', 'comparison', 'cooking', 'sleep', 'Compare with experiment group.'),
  q('Hypothesis → experiment → ___ → conclusion', 'results', 'lunch', 'games', 'Scientific method steps.'),
  q('Latitude and longitude locate places on a ___', 'map', 'menu', 'song', 'GPS coordinates.'),
  q('Equator divides Earth into north and ___', 'south', 'east', 'west', 'Middle line of Earth.'),
  q('A peninsula is land surrounded by water on ___ sides.', 'three', 'all four', 'none', 'Like a arm of land.'),
  q('Archipelago is a group of ___', 'islands', 'mountains', 'rivers', 'Like islands in the sea.'),
  q('Democracy vs dictatorship: who has power?', 'people vs one ruler', 'kings only', 'no one', 'People vote in democracy.'),
  q('GDP measures a country\'s economic ___', 'output', 'weather', 'food', 'Gross Domestic Product.'),
  q('Trade means buying and selling ___', 'goods', 'clouds', 'dreams', 'Exchange products.'),
  q('Import means bring goods from ___', 'abroad', 'home only', 'space', 'From other countries.'),
  q('Export means send goods to other ___', 'countries', 'rooms', 'beds', 'Sell overseas.'),
  q('A tariff is a tax on ___', 'imports', 'friends', 'books', 'Trade tax.'),
  q('Inflation vs deflation: prices go up vs ___', 'down', 'sideways', 'away', 'Deflation lowers prices.'),
  q('A budget deficit means spending more than ___', 'income', 'sleep', 'fun', 'Debt increases.'),
  q('Scholarship helps pay for ___', 'education', 'toys', 'games', 'School funding aid.'),
  q('Internship is short work ___ to learn.', 'experience', 'vacation', 'sleep', 'On-the-job learning.'),
  q('CV is another word for ___', 'resume', 'recipe', 'map', 'Curriculum vitae.'),
  q('Networking means building professional ___', 'connections', 'walls', 'bridges', 'Meet people in your field.'),
  q('Public speaking builds ___ skills.', 'communication', 'cooking', 'running', 'Speak to audiences.'),
  q('Debate club improves ___ thinking.', 'critical', 'lazy', 'slow', 'Argue with evidence.'),
  q('Robotics combines engineering and ___', 'programming', 'cooking', 'painting', 'Build and code robots.'),
  q('3D printing creates objects ___ by layer.', 'layer', 'only flat', 'invisibly', 'Additive manufacturing.'),
  q('Virtual reality feels like you are ___ another place.', 'inside', 'far from', 'under', 'Immersive experience.'),
  q('Cybersecurity protects computers from ___', 'attacks', 'food', 'rain', 'Hackers and viruses.'),
  q('Password should be strong and ___', 'secret', 'shared', 'simple', 'Keep passwords private.'),
  q('Phishing tries to steal your ___ online.', 'information', 'shoes', 'food', 'Fake emails trick you.'),
  q('Copyright protects creative ___', 'works', 'sand', 'wind', 'Books, music, art.'),
  q('Fair use allows limited copying for ___', 'education', 'profit only', 'never', 'School research OK sometimes.'),
  q('Open source software can be shared and ___', 'modified', 'sold only', 'hidden', 'Community improves code.'),
];
bank.push(...more);

const seen = new Set();
const unique = [];
for (const item of bank) {
  if (seen.has(item.question)) continue;
  seen.add(item.question);
  unique.push(item);
}

const final = unique.slice(0, 200).map((item, i) => {
  let rotated = item;
  if (i % 3 === 1) {
    const [a, b, c] = item.options;
    rotated = { ...item, options: [b, a, c], correct_index: 1 };
  } else if (i % 3 === 2) {
    const [a, b, c] = item.options;
    rotated = { ...item, options: [b, c, a], correct_index: 2 };
  }
  return attachImageToQuestion(rotated);
});

if (final.length < 200) {
  console.error(`Only ${final.length} unique junior questions, need 200`);
  process.exit(1);
}

writeFileSync(OUT, JSON.stringify(final, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${final.length} junior questions to ${OUT}`);
