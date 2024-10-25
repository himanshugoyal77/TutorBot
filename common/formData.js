const formData = [
  {
    id: 0,
    key: "Student's Name",
    options: "Name of the student",
    type: "text",
  },
  {
    id: 1,
    key: "Student's Class",
    options: "Student's Class",
    type: "text",
  },
  {
    id: 2,
    key: "Favourite Subjects",
    options: ["Maths", "Science", "History", "Geography", "English", "Hindi"],
    type: "select",
  },
  {
    id: 3,
    key: "Hide Words",
    options: "Comma separated words. Example: fire, death, etc.",
    type: "text",
  },
  {
    id: 4,
    key: "Hobbies",
    options: ["Reading", "Writing", "Drawing", "Sports", "Music", "Dance"],
    type: "select",
  },
  {
    id: 5,
    key: "Cartoon Characters",
    options: [
      "/assets/ash.jpg",
      "/assets/bheem.jpg",
      "/assets/doraemon.jpg",
      "/assets/hattori.jpg",
      "/assets/natuto.jpg",
      "/assets/shinchan.webp",
      "/assets/tomandjerry.jpg",
    ],
    type: "image",
  },
];

export default formData;
