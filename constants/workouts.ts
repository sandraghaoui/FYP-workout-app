export type Exercise = {
  id: number;
  name: string;
  reps: string;
  image: any;
  howTo: string;
  tips: string[];
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
    description: "Quick 10-minute workout to burn calories fast",
    duration: "10 min",
    exercisesCountLabel: "3 exercises",
    tag: "Fat Burning",
    image: require("../assets/images/image3.png"),
    colorGradient: ["#FF6900", "#FB2C36"],
    exercises: [
      {
        id: 1,
        name: "Jumping Jacks",
        reps: "30 sec",
        image: require("../assets/images/jumpingjacks.jpg"),
        howTo:
          "Start with feet together and hands at your sides. Jump your feet out while raising your arms overhead, then return.",
        tips: [
          "Land softly on the balls of your feet.",
          "Keep your core engaged.",
          "Maintain a steady breathing rhythm.",
        ],
      },
      {
        id: 2,
        name: "High Knees",
        reps: "30 sec",
        image: require("../assets/images/image3.png"),
        howTo:
          "Run in place while driving your knees toward your chest as high as possible.",
        tips: [
          "Stay light on your feet.",
          "Pump your arms naturally.",
          "Keep your chest lifted.",
        ],
      },
      {
        id: 3,
        name: "Mountain Climbers",
        reps: "20 reps",
        image: require("../assets/images/image3.png"),
        howTo:
          "Start in a high plank and alternate driving knees toward your chest.",
        tips: [
          "Keep shoulders over wrists.",
          "Do not let your hips sag.",
          "Control the movement before adding speed.",
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Strength Builder",
    description: "Build strength and muscle with this 20-minute routine",
    duration: "20 min",
    exercisesCountLabel: "4 exercises",
    tag: "Muscle Building",
    image: require("../assets/images/image2.png"),
    colorGradient: ["#2B7FFF", "#AD46FF"],
    exercises: [
      {
        id: 1,
        name: "Squats",
        reps: "15 reps",
        image: require("../assets/images/squats.jpg"),
        howTo:
          "Stand with feet shoulder-width apart and sit back as if into a chair, keeping your chest up.",
        tips: [
          "Bend your knees to about 90 degrees.",
          "Keep your back straight.",
          "Push through your heels.",
        ],
      },
      {
        id: 2,
        name: "Push-Ups",
        reps: "12 reps",
        image: require("../assets/images/image2.png"),
        howTo:
          "From a high plank, lower your chest toward the floor and push back up.",
        tips: [
          "Body in a straight line.",
          "Elbows at about 45 degrees.",
          "Engage your core.",
        ],
      },
      {
        id: 3,
        name: "Lunges",
        reps: "10 reps each leg",
        image: require("../assets/images/image2.png"),
        howTo:
          "Step forward into a lunge, lower until both knees are near 90 degrees, then push back.",
        tips: [
          "Front knee over ankle.",
          "Torso upright.",
          "Control the descent.",
        ],
      },
      {
        id: 4,
        name: "Glute Bridge",
        reps: "15 reps",
        image: require("../assets/images/image2.png"),
        howTo: "Lie on your back, feet flat, lift hips while squeezing glutes.",
        tips: [
          "Do not overarch your lower back.",
          "Squeeze at the top.",
          "Feet hip-width apart.",
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Endurance Master",
    description: "Push your limits with this 30-minute endurance challenge",
    duration: "30 min",
    exercisesCountLabel: "4 exercises",
    tag: "Endurance",
    image: require("../assets/images/image4.png"),
    colorGradient: ["#00C950", "#00BBA7"],
    exercises: [
      {
        id: 1,
        name: "Jog in Place",
        reps: "60 sec",
        image: require("../assets/images/jogging.jpg"),
        howTo: "Light jog on the spot, lifting feet slightly off the ground.",
        tips: ["Relax your shoulders.", "Keep a steady pace.", "Breathe rhythmically."],
      },
      {
        id: 2,
        name: "Mountain Climbers",
        reps: "20 reps",
        image: require("../assets/images/image3.png"),
        howTo:
          "Start in a high plank and alternate driving knees toward your chest.",
        tips: [
          "Keep shoulders over wrists.",
          "Do not let your hips sag.",
          "Control the movement before adding speed.",
        ],
      },
      {
        id: 3,
        name: "Jumping Jacks",
        reps: "30 sec",
        image: require("../assets/images/jumpingjacks.jpg"),
        howTo:
          "Start with feet together and hands at your sides. Jump your feet out while raising your arms overhead, then return.",
        tips: ["Land softly.", "Keep rhythm.", "Stay relaxed."],
      },
      {
        id: 4,
        name: "High Knees",
        reps: "30 sec",
        image: require("../assets/images/image3.png"),
        howTo: "Run in place while driving your knees toward your chest.",
        tips: ["Stay light on your feet.", "Pump your arms.", "Keep your chest up."],
      },
    ],
  },
  {
    id: 4,
    title: "Abs Time",
    description: "Target your abs and core with focused exercises",
    duration: "15 min",
    exercisesCountLabel: "3 exercises",
    tag: "Core Strength",
    image: require("../assets/images/image1.png"),
    colorGradient: ["#F0B100", "#FF6900"],
    exercises: [
      {
        id: 1,
        name: "Crunches",
        reps: "15 reps",
        image: require("../assets/images/crunches.jpg"),
        howTo:
          "Lie on your back, knees bent, curl shoulders off the floor toward knees.",
        tips: ["Do not pull on your neck.", "Exhale as you crunch.", "Lower with control."],
      },
      {
        id: 2,
        name: "Mountain Climbers",
        reps: "20 reps",
        image: require("../assets/images/image3.png"),
        howTo:
          "Start in a high plank and alternate driving knees toward your chest.",
        tips: ["Keep your core tight.", "Do not let your hips sag.", "Move with control."],
      },
      {
        id: 3,
        name: "Glute Bridge",
        reps: "15 reps",
        image: require("../assets/images/image2.png"),
        howTo: "Lie on your back, feet flat, lift hips while squeezing glutes.",
        tips: ["Squeeze at the top.", "Keep ribs down.", "Lower slowly."],
      },
    ],
  },
  {
    id: 5,
    title: "Full Body",
    description: "Work every muscle in this full body workout",
    duration: "25 min",
    exercisesCountLabel: "4 exercises",
    tag: "Total Body Fitness",
    image: require("../assets/images/image5.png"),
    colorGradient: ["#F6339A", "#FF2056"],
    exercises: [
      {
        id: 1,
        name: "Push-Ups",
        reps: "12 reps",
        image: require("../assets/images/image2.png"),
        howTo:
          "From a high plank, lower your chest toward the floor and push back up.",
        tips: ["Body in a straight line.", "Elbows at about 45 degrees.", "Engage your core."],
      },
      {
        id: 2,
        name: "Burpees",
        reps: "10 reps",
        image: require("../assets/images/burpees.jpg"),
        howTo:
          "Squat, jump to plank, push-up optional, jump back in and explode upward.",
        tips: ["Move in a smooth flow.", "Land softly.", "Prioritize form over speed."],
      },
      {
        id: 3,
        name: "Squats",
        reps: "15 reps",
        image: require("../assets/images/squats.jpg"),
        howTo:
          "Stand with feet shoulder-width apart and sit back as if into a chair.",
        tips: ["Keep your chest up.", "Push through your heels.", "Control the descent."],
      },
      {
        id: 4,
        name: "Crunches",
        reps: "15 reps",
        image: require("../assets/images/crunches.jpg"),
        howTo: "Lie on your back, knees bent, curl shoulders off the floor.",
        tips: ["Do not pull your neck.", "Exhale as you crunch.", "Lower slowly."],
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
