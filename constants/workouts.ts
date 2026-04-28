export type BackendExerciseKey =
  | "squat"
  | "pushup"
  | "curl"
  | "crunch"
  | "reverse_lunge"
  | "shoulder_press";

export type Exercise = {
  id: number;
  name: string;
  reps: string;
  image: any;
  howTo: string;
  tips: string[];
  backendKey: BackendExerciseKey;
};

export type Workout = {
  id: number;
  title: string;
  description: string;
  duration: string;
  exercisesCountLabel: string;
  tag: string;
  image: any;
  colorGradient: [string, string];
  exercises: Exercise[];
};

export const workouts: Workout[] = [
  {
    id: 1,
    title: "Quick Burn",
    description: "A short AI-tracked routine for quick movement and form practice",
    duration: "10 min",
    exercisesCountLabel: "3 exercises",
    tag: "Quick Start",
    image: require("../assets/images/image3.png"),
    colorGradient: ["#FF6900", "#FB2C36"],
    exercises: [
      {
        id: 1,
        name: "Squats",
        backendKey: "squat",
        reps: "10 reps",
        image: require("../assets/images/squats.jpg"),
        howTo:
          "Stand with feet shoulder-width apart, sit your hips back, bend your knees, then return to standing.",
        tips: [
          "Face the camera from the front.",
          "Keep your chest lifted.",
          "Use controlled depth instead of rushing.",
        ],
      },
      {
        id: 2,
        name: "Push-Ups",
        backendKey: "pushup",
        reps: "8 reps",
        image: require("../assets/images/image2.png"),
        howTo:
          "Start in a plank, lower your chest toward the floor, then press back up.",
        tips: [
          "Use a side view for best tracking.",
          "Keep shoulders, hips, and ankles visible.",
          "Keep your body in one straight line.",
        ],
      },
      {
        id: 3,
        name: "Crunches",
        backendKey: "crunch",
        reps: "12 reps",
        image: require("../assets/images/crunches.jpg"),
        howTo:
          "Lie on your back with knees bent, curl your shoulders upward, then lower with control.",
        tips: [
          "Use a side view if possible.",
          "Do not pull on your neck.",
          "Move slowly enough for the camera to track you.",
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Strength Builder",
    description: "Build strength with AI-tracked upper and lower body movements",
    duration: "20 min",
    exercisesCountLabel: "4 exercises",
    tag: "Muscle Building",
    image: require("../assets/images/image2.png"),
    colorGradient: ["#2B7FFF", "#AD46FF"],
    exercises: [
      {
        id: 1,
        name: "Squats",
        backendKey: "squat",
        reps: "5 reps",
        image: require("../assets/images/squats.jpg"),
        howTo:
          "Stand with feet shoulder-width apart and sit back as if into a chair, keeping your chest up.",
        tips: [
          "Face the camera from the front.",
          "Keep knees tracking over toes.",
          "Push through your heels.",
        ],
      },
      {
        id: 2,
        name: "Push-Ups",
        backendKey: "pushup",
        reps: "5 reps",
        image: require("../assets/images/image2.png"),
        howTo:
          "From a high plank, lower your chest toward the floor and push back up.",
        tips: [
          "Use a side view.",
          "Elbows around 45 degrees.",
          "Keep your core tight.",
        ],
      },
      {
        id: 3,
        name: "Reverse Lunges",
        backendKey: "reverse_lunge",
        reps: "8 reps each leg",
        image: require("../assets/images/image2.png"),
        howTo:
          "Step one leg backward, lower into a lunge, then push through the front foot to stand again.",
        tips: [
          "Face the camera from the front.",
          "Keep your torso upright.",
          "Separate your stance enough for the tracker to see both knees.",
        ],
      },
      {
        id: 4,
        name: "Shoulder Press",
        backendKey: "shoulder_press",
        reps: "10 reps",
        image: require("../assets/images/image3.png"),
        howTo:
          "Start with hands near shoulder level, press upward over your shoulders, then lower with control.",
        tips: [
          "Face the camera from the front.",
          "Keep elbows and wrists visible.",
          "Avoid leaning backward.",
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Endurance Master",
    description: "A longer AI-tracked routine using simple bodyweight movements",
    duration: "30 min",
    exercisesCountLabel: "4 exercises",
    tag: "Endurance",
    image: require("../assets/images/image4.png"),
    colorGradient: ["#00C950", "#00BBA7"],
    exercises: [
      {
        id: 1,
        name: "Squats",
        backendKey: "squat",
        reps: "5 reps",
        image: require("../assets/images/squats.jpg"),
        howTo:
          "Sit your hips back, bend your knees under control, then stand tall again.",
        tips: [
          "Face the camera from the front.",
          "Keep your chest lifted.",
          "Do not bounce at the bottom.",
        ],
      },
      {
        id: 2,
        name: "Reverse Lunges",
        backendKey: "reverse_lunge",
        reps: "5 reps",
        image: require("../assets/images/image2.png"),
        howTo:
          "Step backward into a lunge, lower under control, then return to standing.",
        tips: [
          "Keep the front knee stable.",
          "Stay tall through the torso.",
          "Move slowly enough for tracking.",
        ],
      },
      {
        id: 3,
        name: "Push-Ups",
        backendKey: "pushup",
        reps: "5 reps",
        image: require("../assets/images/image2.png"),
        howTo:
          "Lower from a plank and press back up while keeping a straight body line.",
        tips: [
          "Use a side view.",
          "Keep hips from sagging.",
          "Lock out gently at the top.",
        ],
      },
      {
        id: 4,
        name: "Crunches",
        backendKey: "crunch",
        reps: "5 reps",
        image: require("../assets/images/crunches.jpg"),
        howTo:
          "Curl your shoulders upward from the floor, then return slowly.",
        tips: [
          "Keep neck neutral.",
          "Exhale as you curl up.",
          "Control the way down.",
        ],
      },
    ],
  },
  {
    id: 4,
    title: "Abs Time",
    description: "Core-focused session with simple AI-tracked movements",
    duration: "15 min",
    exercisesCountLabel: "3 exercises",
    tag: "Core Strength",
    image: require("../assets/images/image1.png"),
    colorGradient: ["#F0B100", "#FF6900"],
    exercises: [
      {
        id: 1,
        name: "Crunches",
        backendKey: "crunch",
        reps: "5 reps",
        image: require("../assets/images/crunches.jpg"),
        howTo:
          "Lie on your back, knees bent, curl shoulders off the floor toward knees.",
        tips: [
          "Use a side view if possible.",
          "Do not pull on your neck.",
          "Lower with control.",
        ],
      },
      {
        id: 2,
        name: "Push-Ups",
        backendKey: "pushup",
        reps: "5 reps",
        image: require("../assets/images/image2.png"),
        howTo:
          "Hold a strong plank, lower your chest, then press back up.",
        tips: [
          "Use a side view.",
          "Keep core tight.",
          "Avoid hip sag.",
        ],
      },
      {
        id: 3,
        name: "Squats",
        backendKey: "squat",
        reps: "5 reps",
        image: require("../assets/images/squats.jpg"),
        howTo:
          "Stand tall, sit your hips back, then return to standing.",
        tips: [
          "Face the camera from the front.",
          "Keep knees stable.",
          "Control every rep.",
        ],
      },
    ],
  },
  {
    id: 5,
    title: "Full Body",
    description: "A balanced full-body workout using every AI-tracked movement available",
    duration: "25 min",
    exercisesCountLabel: "6 exercises",
    tag: "Total Body Fitness",
    image: require("../assets/images/image5.png"),
    colorGradient: ["#F6339A", "#FF2056"],
    exercises: [
      {
        id: 1,
        name: "Squats",
        backendKey: "squat",
        reps: "12 reps",
        image: require("../assets/images/squats.jpg"),
        howTo:
          "Stand with feet shoulder-width apart and sit back as if into a chair, then stand tall again.",
        tips: [
          "Face the camera from the front.",
          "Keep your chest up.",
          "Use controlled depth.",
        ],
      },
      {
        id: 2,
        name: "Reverse Lunges",
        backendKey: "reverse_lunge",
        reps: "8 reps each leg",
        image: require("../assets/images/image2.png"),
        howTo:
          "Step backward into a lunge, lower under control, then return to standing.",
        tips: [
          "Face the camera from the front.",
          "Keep your torso tall.",
          "Split your stance clearly.",
        ],
      },
      {
        id: 3,
        name: "Push-Ups",
        backendKey: "pushup",
        reps: "5 reps",
        image: require("../assets/images/image2.png"),
        howTo:
          "Turn sideways to the camera. Lower your chest toward the floor, then press back up.",
        tips: [
          "Use a side view.",
          "Keep shoulders, hips, and feet visible.",
          "Keep your body in one line.",
        ],
      },
      {
        id: 4,
        name: "Bicep Curls",
        backendKey: "curl",
        reps: "5 reps",
        image: require("../assets/images/image3.png"),
        howTo:
          "Stand tall and curl your hands toward your shoulders while keeping your elbows close to your body.",
        tips: [
          "Face the camera from the front.",
          "Do not swing your torso.",
          "Lower with control.",
        ],
      },
      {
        id: 5,
        name: "Shoulder Press",
        backendKey: "shoulder_press",
        reps: "5 reps",
        image: require("../assets/images/image3.png"),
        howTo:
          "Start with hands near shoulder level, press upward, then lower back with control.",
        tips: [
          "Face the camera from the front.",
          "Keep elbows visible.",
          "Press straight up without leaning back.",
        ],
      },
      {
        id: 6,
        name: "Crunches",
        backendKey: "crunch",
        reps: "3 reps",
        image: require("../assets/images/crunches.jpg"),
        howTo:
          "Lie on your back, knees bent, and curl your shoulders upward before lowering slowly.",
        tips: [
          "Use a side view if possible.",
          "Do not pull your neck.",
          "Move slowly enough for tracking.",
        ],
      },
    ],
  },
  {
    id: 6,
    title: "Lower Body",
    description: "A lower-body session focused on legs, glutes, and clean movement control",
    duration: "20 min",
    exercisesCountLabel: "3 exercises",
    tag: "Legs & Glutes",
    image: require("../assets/images/squats.jpg"),
    colorGradient: ["#22C55E", "#15803D"],
    exercises: [
      {
        id: 1,
        name: "Squats",
        backendKey: "squat",
        reps: "5 reps",
        image: require("../assets/images/squats.jpg"),
        howTo:
          "Stand with feet shoulder-width apart, bend your knees, sit back, then return to standing.",
        tips: [
          "Face the camera from the front.",
          "Keep knees tracking over toes.",
          "Use controlled depth, not a forced deep squat.",
        ],
      },
      {
        id: 2,
        name: "Reverse Lunges",
        backendKey: "reverse_lunge",
        reps: "5 reps",
        image: require("../assets/images/image2.png"),
        howTo:
          "Step one leg backward, lower into a lunge, then push through the front foot to stand again.",
        tips: [
          "Face the camera from the front.",
          "Keep your torso upright.",
          "Make the stance clear so both knees are visible.",
        ],
      },
      {
        id: 3,
        name: "Squats Finisher",
        backendKey: "squat",
        reps: "5 reps",
        image: require("../assets/images/squats.jpg"),
        howTo:
          "Repeat controlled squats for a short finisher, keeping the same clean form.",
        tips: [
          "Slow down if tracking becomes unstable.",
          "Stay fully in frame.",
          "Keep reps clean rather than fast.",
        ],
      },
    ],
  },
  {
    id: 99,
    title: "Upper Body Test",
    description: "Test workout with bicep curls, shoulder press, and push-ups",
    duration: "15 min",
    exercisesCountLabel: "3 exercises",
    tag: "Test Workout",
    image: require("../assets/images/image3.png"),
    colorGradient: ["#FF6900", "#7C2D12"],
    exercises: [
      {
        id: 1,
        name: "Bicep Curls",
        backendKey: "curl",
        reps: "5 reps",
        image: require("../assets/images/image3.png"),
        howTo:
          "Stand tall and curl the weight up while keeping your elbows stable.",
        tips: [
          "Face the camera from the front.",
          "Keep your elbows close to your body.",
          "Avoid swinging your torso.",
        ],
      },
      {
        id: 2,
        name: "Shoulder Press",
        backendKey: "shoulder_press",
        reps: "5 reps",
        image: require("../assets/images/image3.png"),
        howTo:
          "Press your hands upward over your shoulders, then lower with control.",
        tips: [
          "Face the camera from the front.",
          "Press straight up.",
          "Lower until elbows are around shoulder level.",
        ],
      },
      {
        id: 3,
        name: "Push-Ups",
        backendKey: "pushup",
        reps: "5 reps",
        image: require("../assets/images/image2.png"),
        howTo:
          "Turn sideways to the camera. Lower your chest toward the floor, then push back up.",
        tips: [
          "Use a side view for best tracking.",
          "Keep your body straight.",
          "Make sure hands, shoulders, hips, and feet stay visible.",
        ],
      },
    ],
  },
];
