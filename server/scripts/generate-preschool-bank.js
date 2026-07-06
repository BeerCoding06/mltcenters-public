/**
 * Generate 200 English MCQ for runner game.
 * Run: node server/scripts/generate-preschool-bank.js
 */
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { attachImageToQuestion } from '../lib/question-images.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../data/fallback_questions.json');
const IMAGE_BASE = '/assets/image-game';

function q(question, correct, wrong1, wrong2, explanation) {
  const opts = [correct, wrong1, wrong2];
  const correct_index = 0;
  return { question, options: opts, correct_index, explanation };
}

function qPhoto(question, correct, wrong1, wrong2, explanation, imageFile, imageFocus) {
  const item = {
    ...q(question, correct, wrong1, wrong2, explanation),
    image: `${IMAGE_BASE}/${imageFile}`,
  };
  if (imageFocus) item.image_focus = imageFocus;
  return item;
}

function qRot(question, a, b, c, correctIndex, explanation) {
  const opts = [a, b, c];
  return { question, options: opts, correct_index: correctIndex, explanation };
}

const bank = [];

// —— Colors (35) ——
const colors = [
  ['red', 'apple', 'Many apples are red.'],
  ['blue', 'sky', 'The sky is blue.'],
  ['green', 'grass', 'Grass is green.'],
  ['yellow', 'sun', 'The sun is yellow.'],
  ['orange', 'carrot', 'Carrots are orange.'],
  ['pink', 'flower', 'Some flowers are pink.'],
  ['purple', 'grape', 'Grapes can be purple.'],
  ['brown', 'bear', 'Bears are brown.'],
  ['black', 'night', 'Night is dark black.'],
  ['white', 'cloud', 'Clouds are white.'],
];
colors.forEach(([color, thing, exp]) => {
  bank.push(q(`What color is the ${thing}?`, color, 'pink', 'gray', exp));
  bank.push(qRot(`Find the color: ${color}`, color, 'seven', 'run', 0, `${color} is a color.`));
});
bank.push(qPhoto('Ball color?', 'red', 'eat', 'jump', 'A ball can be red.', 'Ball-color.webp'));
bank.push(qPhoto('Leaf color?', 'green', 'hot', 'loud', 'Leaves are green.', 'Leaf-color.webp'));
bank.push(qPhoto('Fire truck color?', 'red', 'soft', 'slow', 'Fire trucks are red.', 'Fire-truck-color.webp'));
bank.push(qPhoto('Snow color?', 'white', 'big', 'fast', 'Snow is white.', 'Snow-color.webp'));
bank.push(qPhoto('Chocolate color?', 'brown', 'fly', 'sing', 'Chocolate is brown.', 'Chocolate-color.webp'));

// —— Animals & sounds (40) —— shared panorama; image_focus pans to each animal
const ANIMALS_SOUND_IMAGE = 'animals-sounds.webp';
/** Left→right in animals-sounds.webp (2816×1536). Adjust x/y if crop is off. */
const ANIMAL_FOCUS = {
  cat: { x: 7, y: 52 },
  dog: { x: 17, y: 52 },
  cow: { x: 27, y: 52 },
  duck: { x: 37, y: 52 },
  sheep: { x: 47, y: 52 },
  pig: { x: 57, y: 52 },
  bird: { x: 67, y: 52 },
  frog: { x: 77, y: 52 },
  horse: { x: 87, y: 52 },
  lion: { x: 93, y: 52 },
};
const animals = [
  ['cat', 'meow', 'Cats say meow.'],
  ['dog', 'woof', 'Dogs say woof.'],
  ['cow', 'moo', 'Cows say moo.'],
  ['duck', 'quack', 'Ducks say quack.'],
  ['sheep', 'baa', 'Sheep say baa.'],
  ['pig', 'oink', 'Pigs say oink.'],
  ['bird', 'tweet', 'Birds say tweet.'],
  ['frog', 'ribbit', 'Frogs say ribbit.'],
  ['horse', 'neigh', 'Horses say neigh.'],
  ['lion', 'roar', 'Lions say roar.'],
];
animals.forEach(([animal, sound, exp]) => {
  const focus = ANIMAL_FOCUS[animal];
  bank.push(
    qPhoto(`Which animal says "${sound}"?`, animal, 'fish', 'bug', exp, ANIMALS_SOUND_IMAGE, focus),
  );
  bank.push(
    qPhoto(`Is a ${animal} an animal?`, 'yes', 'no', 'maybe', `A ${animal} is an animal.`, ANIMALS_SOUND_IMAGE, focus),
  );
});
bank.push(qPhoto('Fish live in ___', 'water', 'sky', 'fire', 'Fish live in water.', 'Fish-live-in.webp'));
bank.push(qPhoto('Birds can ___', 'fly', 'drive', 'cook', 'Birds can fly.', 'Birds-can.webp'));
bank.push(qPhoto('A baby cat is a ___', 'kitten', 'puppy', 'calf', 'A baby cat is a kitten.', 'A-baby-cat-is-a.webp'));
bank.push(qPhoto('A baby dog is a ___', 'puppy', 'kitten', 'chick', 'A baby dog is a puppy.', 'A-baby-dog-is-a.webp'));
bank.push(qPhoto('Elephant is ___', 'big', 'tiny', 'cold', 'Elephants are big.', 'Elephant-is.webp'));
bank.push(qPhoto('Ant is ___', 'small', 'huge', 'loud', 'Ants are small.', 'Ant-is.webp'));
bank.push(qPhoto('Bee makes ___', 'honey', 'rice', 'shoes', 'Bees make honey.', 'Bee-makes.webp'));
bank.push(qPhoto('Where is the fish?', 'water', 'tree', 'cloud', 'Fish are in water.', 'Where-is-the-fish.webp'));
bank.push(qPhoto('Rabbit likes ___', 'carrot', 'rock', 'hat', 'Rabbits like carrots.', 'Rabbit-likes.webp'));
bank.push(qPhoto('Monkey likes ___', 'banana', 'ice', 'book', 'Monkeys like bananas.', 'Monkey-likes.webp'));

// —— Body (25) ——
const body = [
  ['eyes', 'two', 'We have two eyes.'],
  ['ears', 'two', 'We have two ears.'],
  ['nose', 'one', 'We have one nose.'],
  ['mouth', 'one', 'We have one mouth.'],
  ['hands', 'two', 'We have two hands.'],
  ['feet', 'two', 'We have two feet.'],
  ['fingers', 'ten', 'We have ten fingers.'],
  ['head', 'one', 'We have one head.'],
];
body.forEach(([part, count, exp]) => {
  bank.push(q(`How many ${part}?`, count, 'five', 'zero', exp));
});
bank.push(q('You see with your ___', 'eyes', 'toes', 'knee', 'You see with eyes.'));
bank.push(q('You hear with your ___', 'ears', 'nose', 'hair', 'You hear with ears.'));
bank.push(q('You smell with your ___', 'nose', 'foot', 'arm', 'You smell with your nose.'));
bank.push(q('You eat with your ___', 'mouth', 'elbow', 'leg', 'You eat with your mouth.'));
bank.push(q('Wiggle your ___', 'toes', 'sky', 'car', 'You wiggle your toes.'));
bank.push(q('Clap your ___', 'hands', 'cloud', 'road', 'You clap your hands.'));
bank.push(q('Stomp your ___', 'feet', 'moon', 'star', 'You stomp your feet.'));
bank.push(q('Hair is on your ___', 'head', 'shoe', 'cup', 'Hair is on your head.'));
bank.push(q('Teeth are in your ___', 'mouth', 'ear', 'knee', 'Teeth are in your mouth.'));
bank.push(q('Tummy is also called ___', 'belly', 'wheel', 'door', 'Tummy means belly.'));

// —— Family (15) ——
bank.push(q('Mom and ___', 'dad', 'bus', 'ball', 'Mom and dad are family.'));
bank.push(q('Your mom is your ___', 'mother', 'teacher', 'doctor', 'Mom is your mother.'));
bank.push(q('Your dad is your ___', 'father', 'table', 'cloud', 'Dad is your father.'));
bank.push(q('Baby says ___', 'mama', 'vroom', 'beep', 'Babies often say mama.'));
bank.push(q('Grandma is mom\'s ___', 'mother', 'car', 'toy', 'Grandma is mother of mom or dad.'));
bank.push(q('Brother is a ___', 'boy', 'fruit', 'color', 'A brother is a boy in family.'));
bank.push(q('Sister is a ___', 'girl', 'truck', 'rain', 'A sister is a girl in family.'));
bank.push(q('I love my ___', 'family', 'shoe', 'rock', 'We love our family.'));
bank.push(q('Dad gives a big ___', 'hug', 'jump', 'run', 'Dad can give a hug.'));
bank.push(q('Mom reads a ___', 'book', 'car', 'shoe', 'Mom can read a book.'));
bank.push(q('Baby drinks ___', 'milk', 'sand', 'stone', 'Babies drink milk.'));
bank.push(q('Family eats together at ___', 'table', 'moon', 'star', 'We eat at the table.'));
bank.push(q('Who tucks you in bed?', 'mom', 'car', 'ball', 'Mom or dad tucks you in.'));
bank.push(q('Baby sleeps in a ___', 'crib', 'bus', 'tree', 'Babies sleep in a crib.'));
bank.push(q('We live in a ___', 'home', 'river', 'cloud', 'We live in a home.'));

// —— Food & drink (30) ——
const foods = [
  ['apple', 'fruit', 'An apple is a fruit.'],
  ['banana', 'fruit', 'A banana is a fruit.'],
  ['rice', 'food', 'Rice is food.'],
  ['milk', 'drink', 'Milk is a drink.'],
  ['water', 'drink', 'Water is a drink.'],
  ['bread', 'food', 'Bread is food.'],
  ['egg', 'food', 'An egg is food.'],
  ['cookie', 'snack', 'A cookie is a snack.'],
  ['cake', 'sweet', 'Cake is sweet.'],
  ['juice', 'drink', 'Juice is a drink.'],
];
foods.forEach(([item, type, exp]) => {
  bank.push(q(`Is ${item} yummy?`, 'yes', 'no', 'maybe', `Many kids like ${item}.`));
  bank.push(qRot(`What is ${item}?`, item, 'chair', 'hat', 0, exp));
});
bank.push(q('We eat soup with a ___', 'spoon', 'shoe', 'ball', 'We use a spoon.'));
bank.push(q('Hot food can ___ you', 'burn', 'fly', 'sing', 'Hot food can burn.'));
bank.push(q('Ice cream is ___', 'cold', 'hot', 'loud', 'Ice cream is cold.'));
bank.push(q('Pizza is ___', 'yummy', 'sleepy', 'tall', 'Pizza is yummy.'));
bank.push(q('Carrot is a ___', 'vegetable', 'animal', 'toy', 'Carrot is a vegetable.'));
bank.push(q('Corn is ___ and yellow', 'yummy', 'blue', 'fast', 'Corn is yellow.'));
bank.push(q('Fish is ___ to eat', 'food', 'shoe', 'hat', 'Fish can be food.'));
bank.push(q('Honey is ___', 'sweet', 'salty', 'loud', 'Honey is sweet.'));
bank.push(q('Lemon is ___', 'sour', 'big', 'soft', 'Lemons are sour.'));
bank.push(q('Breakfast is in the ___', 'morning', 'night', 'moon', 'Breakfast is in the morning.'));

// —— Numbers (25) ——
for (let n = 1; n <= 10; n += 1) {
  const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const w = words[n - 1];
  const wrong = words[(n % 10)];
  const wrong2 = words[((n + 3) % 10)];
  bank.push(q(`What number? ${n}`, w, wrong, wrong2, `${n} is ${w}.`));
}
bank.push(q('Count: 1, 2, ___', 'three', 'ten', 'zero', 'One two three.'));
bank.push(q('How many legs on a dog?', 'four', 'two', 'ten', 'Dogs have four legs.'));
bank.push(q('Fingers on one hand?', 'five', 'two', 'eight', 'Five fingers on one hand.'));
bank.push(q('Days in one week?', 'seven', 'three', 'ten', 'Seven days in a week.'));
bank.push(q('More than one = ___', 'many', 'sleep', 'cold', 'Many means a lot.'));
bank.push(q('Less than two = ___', 'one', 'five', 'nine', 'One is less than two.'));
bank.push(q('A pair means ___', 'two', 'ten', 'zero', 'A pair is two things.'));
bank.push(q('Zero means ___', 'none', 'many', 'big', 'Zero means none.'));
bank.push(q('Ten comes after ___', 'nine', 'two', 'four', 'Nine then ten.'));
bank.push(q('Three bears story: ___ bears', 'three', 'one', 'ten', 'Three bears in the story.'));
bank.push(q('Wheels on a car?', 'four', 'one', 'nine', 'Cars have four wheels.'));
bank.push(q('Sides on a triangle?', 'three', 'five', 'eight', 'A triangle has three sides.'));
bank.push(q('Eggs in a pair?', 'two', 'seven', 'zero', 'A pair is two.'));
bank.push(q('Ducks in a row: 1,2,3 = ___', 'three', 'six', 'nine', 'One two three is three.'));
bank.push(q('How many noses?', 'one', 'four', 'six', 'You have one nose.'));

// —— Toys & play (15) ——
bank.push(q('Ball is for ___', 'play', 'eat', 'sleep', 'We play with a ball.'));
bank.push(q('Doll is a ___', 'toy', 'food', 'car', 'A doll is a toy.'));
bank.push(q('Blocks you can ___', 'stack', 'drink', 'fly', 'You stack blocks.'));
bank.push(q('Kite flies in the ___', 'sky', 'water', 'sand', 'Kites fly in the sky.'));
bank.push(q('Slide at the ___', 'park', 'moon', 'bed', 'Slides are at the park.'));
bank.push(q('Swing goes back and ___', 'forth', 'up', 'eat', 'A swing goes back and forth.'));
bank.push(q('Bubbles are ___', 'fun', 'hot', 'loud', 'Bubbles are fun.'));
bank.push(q('Sandbox has ___', 'sand', 'milk', 'rain', 'A sandbox has sand.'));
bank.push(q('Teddy bear is ___', 'soft', 'loud', 'fast', 'Teddy bears are soft.'));
bank.push(q('Puzzle pieces fit ___', 'together', 'apart', 'away', 'Puzzle pieces fit together.'));
bank.push(q('Crayons draw ___', 'pictures', 'cars', 'shoes', 'Crayons draw pictures.'));
bank.push(q('Drum makes ___', 'sound', 'food', 'sleep', 'Drums make sound.'));
bank.push(q('Hide and ___', 'seek', 'run', 'eat', 'Hide and seek is a game.'));
bank.push(q('Tag game: you ___ friends', 'chase', 'cook', 'read', 'In tag you chase friends.'));
bank.push(q('Bounce the ___', 'ball', 'book', 'spoon', 'You bounce a ball.'));

// —— Weather & nature (20) ——
bank.push(q('Sun is ___', 'hot', 'cold', 'wet', 'The sun is hot.'));
bank.push(q('Rain makes you ___', 'wet', 'dry', 'tall', 'Rain makes you wet.'));
bank.push(q('Snow is ___', 'cold', 'hot', 'loud', 'Snow is cold.'));
bank.push(q('Wind blows ___', 'air', 'rice', 'shoe', 'Wind blows air.'));
bank.push(q('Rainbow has many ___', 'colors', 'cars', 'dogs', 'Rainbows have colors.'));
bank.push(q('Clouds are in the ___', 'sky', 'sea', 'box', 'Clouds are in the sky.'));
bank.push(q('Thunder is ___', 'loud', 'soft', 'tiny', 'Thunder is loud.'));
bank.push(q('Umbrella for ___', 'rain', 'sun', 'play', 'Umbrella is for rain.'));
bank.push(q('Tree has ___', 'leaves', 'wheels', 'wings', 'Trees have leaves.'));
bank.push(q('Flower smells ___', 'nice', 'loud', 'fast', 'Flowers smell nice.'));
bank.push(q('Butterfly can ___', 'fly', 'swim', 'drive', 'Butterflies fly.'));
bank.push(q('Star shines at ___', 'night', 'lunch', 'bath', 'Stars shine at night.'));
bank.push(q('Moon at ___', 'night', 'breakfast', 'run', 'We see the moon at night.'));
bank.push(q('Ocean is big ___', 'water', 'sand', 'grass', 'The ocean is water.'));
bank.push(q('Beach has ___', 'sand', 'snow', 'fire', 'Beaches have sand.'));
bank.push(q('Mountain is very ___', 'tall', 'wet', 'sweet', 'Mountains are tall.'));
bank.push(q('River flows with ___', 'water', 'bread', 'toys', 'Rivers have water.'));
bank.push(q('Plant needs ___', 'water', 'shoes', 'cars', 'Plants need water.'));
bank.push(q('Seed grows into a ___', 'plant', 'car', 'hat', 'Seeds grow into plants.'));
bank.push(q('Garden has ___', 'flowers', 'buses', 'shoes', 'Gardens have flowers.'));

// —— Vehicles (12) ——
bank.push(q('Car has ___', 'wheels', 'wings', 'fins', 'Cars have wheels.'));
bank.push(q('Bus is ___ than a bike', 'bigger', 'smaller', 'softer', 'A bus is bigger.'));
bank.push(q('Train goes on ___', 'tracks', 'clouds', 'trees', 'Trains go on tracks.'));
bank.push(q('Plane flies in the ___', 'sky', 'water', 'sand', 'Planes fly in the sky.'));
bank.push(q('Boat floats on ___', 'water', 'grass', 'fire', 'Boats float on water.'));
bank.push(q('Bike has two ___', 'wheels', 'wings', 'noses', 'Bikes have two wheels.'));
bank.push(q('Fire truck helps put out ___', 'fire', 'toys', 'cake', 'Fire trucks fight fire.'));
bank.push(q('Ambulance helps ___ people', 'sick', 'sleep', 'play', 'Ambulances help sick people.'));
bank.push(q('Truck carries ___', 'things', 'clouds', 'stars', 'Trucks carry things.'));
bank.push(q('Helicopter has big ___', 'blades', 'cookies', 'socks', 'Helicopters have blades.'));
bank.push(q('Rocket goes to ___', 'space', 'bed', 'bath', 'Rockets go to space.'));
bank.push(q('Honk goes the ___', 'horn', 'shoe', 'hat', 'Cars honk the horn.'));

// —— Feelings & actions (15) ——
bank.push(q('Happy face ___', 'smile', 'cry', 'sleep', 'Happy means smile.'));
bank.push(q('Sad means you may ___', 'cry', 'fly', 'cook', 'Sad people may cry.'));
bank.push(q('Angry face is ___', 'mad', 'soft', 'sweet', 'Angry means mad.'));
bank.push(q('Tired means need ___', 'sleep', 'run', 'jump', 'Tired means need sleep.'));
bank.push(q('Scared means a little ___', 'afraid', 'hungry', 'tall', 'Scared means afraid.'));
bank.push(q('Excited means very ___', 'happy', 'sleepy', 'cold', 'Excited is very happy.'));
bank.push(q('Laugh when something is ___', 'funny', 'sad', 'cold', 'We laugh when funny.'));
bank.push(q('Yummy food makes you ___', 'happy', 'sad', 'mad', 'Yummy food makes us happy.'));
bank.push(q('Hug shows ___', 'love', 'anger', 'rain', 'Hugs show love.'));
bank.push(q('Please and thank you are ___', 'nice', 'loud', 'fast', 'Please and thank you are nice.'));
bank.push(q('Share toys with ___', 'friends', 'rocks', 'shoes', 'Share with friends.'));
bank.push(q('Jump is up and ___', 'down', 'eat', 'sleep', 'Jump goes up and down.'));
bank.push(q('Run is ___', 'fast', 'slow', 'soft', 'Run is fast.'));
bank.push(q('Walk is ___ than run', 'slower', 'faster', 'louder', 'Walk is slower than run.'));
bank.push(q('Sleep at ___', 'night', 'run', 'jump', 'We sleep at night.'));

// —— Clothes (12) ——
bank.push(q('Shoes go on ___', 'feet', 'head', 'hand', 'Shoes go on feet.'));
bank.push(q('Hat goes on your ___', 'head', 'toe', 'knee', 'Hats go on your head.'));
bank.push(q('Socks keep feet ___', 'warm', 'loud', 'fast', 'Socks keep feet warm.'));
bank.push(q('Shirt goes on your ___', 'body', 'nose', 'ear', 'Shirts go on your body.'));
bank.push(q('Pants go on your ___', 'legs', 'eyes', 'mouth', 'Pants go on legs.'));
bank.push(q('Coat is for ___ weather', 'cold', 'hot', 'loud', 'Coats are for cold weather.'));
bank.push(q('Raincoat for ___', 'rain', 'sun', 'play', 'Raincoats are for rain.'));
bank.push(q('Pajamas for ___', 'sleep', 'run', 'swim', 'Pajamas are for sleep.'));
bank.push(q('Belt holds up ___', 'pants', 'cloud', 'star', 'Belts hold up pants.'));
bank.push(q('Gloves go on ___', 'hands', 'feet', 'ears', 'Gloves go on hands.'));
bank.push(q('Scarf keeps neck ___', 'warm', 'wet', 'fast', 'Scarves keep neck warm.'));
bank.push(q('Dress is for a ___', 'girl', 'car', 'tree', 'A dress is clothing.'));

// Trim / dedupe to exactly 200
const seen = new Set();
const unique = [];
for (const item of bank) {
  if (seen.has(item.question)) continue;
  seen.add(item.question);
  unique.push(item);
}

// Rotate correct_index for variety on remaining items
const final = unique.slice(0, 200).map((item, i) => {
  let rotated = item;
  if (i % 3 === 1) {
    const [a, b, c] = item.options;
    rotated = { ...item, options: [b, a, c], correct_index: 1 };
  } else if (i % 3 === 2) {
    const [a, b, c] = item.options;
    rotated = { ...item, options: [b, c, a], correct_index: 2 };
  }
  return attachImageToQuestion({ ...rotated, band: 'young' });
});

if (final.length < 200) {
  console.error(`Only ${final.length} unique questions generated, need 200`);
  process.exit(1);
}

const OUT_YOUNG = path.join(__dirname, '../data/questions_young.json');
writeFileSync(OUT_YOUNG, JSON.stringify(final, null, 2) + '\n', 'utf-8');
writeFileSync(OUT, JSON.stringify(final, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${final.length} young questions to ${OUT_YOUNG}`);
