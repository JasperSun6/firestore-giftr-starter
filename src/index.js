import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

/* Firebase Configurations */
const firebaseConfig = {
  apiKey: "AIzaSyD5QvBtCjpjbXqv7dxNVCKcJmH2RSJCgyw",
  authDomain: "fire-giftr-ebd49.firebaseapp.com",
  projectId: "fire-giftr-ebd49",
  storageBucket: "fire-giftr-ebd49.appspot.com",
  messagingSenderId: "80979594762",
  appId: "1:80979594762:web:76effb0d1a313ba1e8d9f3",
  measurementId: "G-YN8PP7ZPFE",
};

/* Initialize Firebase */
const app = initializeApp(firebaseConfig);
/* Get a reference to the database */
const db = getFirestore(app);

let people = [];
let ideas = [];
let selectedPersonId = null;
let selectedIdeaId = null;
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* Listeners */
document.addEventListener("DOMContentLoaded", () => {
  peopleSnapshot();

  //set up the dom events
  document
    .getElementById("btnCancelPerson")
    .addEventListener("click", hideOverlay);
  document
    .getElementById("btnCancelIdea")
    .addEventListener("click", hideOverlay);
  document.querySelector(".overlay").addEventListener("click", hideOverlay);

  document
    .getElementById("btnAddPerson")
    .addEventListener("click", showOverlay);

  document
    .getElementById("btnSavePerson")
    .addEventListener("click", savePerson);

  document.getElementById("btnAddIdea").addEventListener("click", showOverlay);
  document.getElementById("btnSaveIdea").addEventListener("click", saveIdea);

  document
    .querySelector(".person-list")
    .addEventListener("click", handleSelectPerson);

  document
    .querySelector(".idea-list")
    .addEventListener("click", handleSelectIdea);
});

const q = query(collection(db, "people"));

const peopleSnapshot = () => {
  onSnapshot(q, (snapshot) => {
    people = [];
    ideas = [];
    snapshot.docs.map((doc) => {
      const data = doc.data();
      const personId = doc.id;
      people.push({ personId, ...data });
      return doc.data();
    });
    buildPeople(people);
  });
  (err) => {
    alert(err);
  };
};

async function getIdeas(id) {
  ideas = [];
  const personRef = doc(collection(db, "people"), id);
  const ideaCollectionRef = collection(db, "gift-ideas");
  const docs = query(ideaCollectionRef, where("person-id", "==", personRef));
  const gifts = await getDocs(docs);
  gifts.forEach((doc) => {
    const data = doc.data();
    const giftId = doc.id;
    ideas.push({ giftId, ...data });
  });
  buildIdeas(ideas);
  (err) => {
    alert(err);
  };
}

function buildPeople(people) {
  //build the HTML
  const ul = document.querySelector("ul.person-list");
  ul.innerHTML = "";
  //replace the old ul contents with the new.
  ul.innerHTML = people
    .map((person) => {
      const dob = `${months[person["birth-month"] - 1]} ${person["birth-day"]}`;
      //Use the number of the birth-month less 1 as the index for the months array
      return `<li data-id="${person.personId}" class="person">
              <p class="name">${person.name}</p>
              <p class="dob">${dob}</p>
              <button id="editPersonBtn">Edit</button>
              <button id="deletePersonBth">Delete</button>
            </li>`;
    })
    .join("");
  // return the first person's id
  let selected = people[0].id;
  return selected;
}

function buildIdeas(ideas) {
  const ul = document.querySelector(".idea-list");
  ul.innerHTML = "";

  if (ideas.length) {
    ul.innerHTML = ideas
      .map((idea) => {
        console.log(idea);
        return `<li class="idea" data-id="${idea.giftId}">
                <label for="chk-${idea.giftId}"
                  ><input type="checkbox" id="chk-${idea.giftId} class="bought" /> Bought</label
                >
                <p class="title">${idea.idea}</p>
                <p class="location">${idea.location}</p>
                <button id="editIdeaBtn">Edit</button>
                <button id="deleteIdeaBth">Delete</button>
              </li>`;
      })
      .join("");
  } else {
    ul.innerHTML =
      '<li class="idea"><p></p><p  class="noGift">No gift Ideas for selected person.</p></li>';
  }
  ideas = [];
}

function handleSelectPerson(ev) {
  const li = ev.target.closest(".person"); //see if there is a parent <li class="person">
  const id = li.getAttribute("data-id"); // if li exists then the user clicked inside an <li>

  //user clicked inside li
  selectedPersonId = id;
  if (ev.target.id === "editPersonBtn") {
    showOverlay(ev);
  } else if (ev.target.id === "deletePersonBth") {
    let result = confirm("Are you sure you want to delete this person?");
    if (result) {
      let ref = doc(db, "people", `${id}`);
      deleteDoc(ref).catch((err) => console.warn(err));
    }
  } else {
    document.querySelector("li.selected")?.classList.remove("selected");
    li.classList.add("selected");
    getIdeas(id);
  }
}

function handleSelectIdea(ev) {
  selectedIdeaId = ev.target.parentElement.getAttribute("data-id");
  if (ev.target.id === "editIdeaBtn") {
    showOverlay(ev);
  } else if (ev.target.id === "deleteIdeaBth") {
    let result = confirm("Are you sure you want to delete this idea?");
    if (result) {
      let ref = doc(db, "gift-ideas", `${selectedIdeaId}`);
      deleteDoc(ref).catch((err) => console.warn(err));
    }
  }
  getIdeas(selectedPersonId);
}

const editPerson = async (selectedPersonId, person) => {
  let ref = doc(db, "people", `${selectedPersonId}`);
  await updateDoc(ref, person);
};

const editIdea = async (selectedIdeaId, idea) => {
  console.log(selectedIdeaId);
  let ref = doc(db, "gift-ideas", `${selectedIdeaId}`);
  await updateDoc(ref, idea);
};

async function savePerson(ev) {
  let id = selectedPersonId;
  let name = document.getElementById("name").value;
  let month = document.getElementById("month").value;
  let day = document.getElementById("day").value;
  if (!name || !month || !day) return;
  const person = {
    name,
    "birth-month": month,
    "birth-day": day,
  };
  if (ev.target.closest(".add")) {
    const docRef = await addDoc(collection(db, "people"), person);

    document.getElementById("name").value = "";
    document.getElementById("month").value = "1";
    document.getElementById("day").value = "1";
    document.querySelector(".overlay").click();
    person.id = docRef.id;
  } else if (ev.target.closest(".edit")) {
    await editPerson(id, {
      name: name,
      "birth-month": month,
      "birth-day": day,
    });
    document.getElementById("name").value = "";
    document.getElementById("month").value = "1";
    document.getElementById("day").value = "1";
    hideOverlay(ev);
  }
}

async function saveIdea(ev) {
  let overlayTitle = document.querySelector("#dlgIdea h2").innerHTML;
  const title = document.getElementById("title").value;
  const location = document.getElementById("location").value;
  const personRef = doc(
    document.querySelector("#dlgIdea h2").innerHTMLdb,
    `/people/${selectedPersonId}`
  );
  if (!title || !location || !personRef) return;

  const idea = {
    idea: title,
    location,
    "person-id": personRef,
    bought: false,
  };
  const giftRef = collection(db, "gift-ideas", idea);

  if (overlayTitle === "Add Gift Idea") {
    await addDoc(giftRef, idea);
    document.getElementById("title").value = "";
    document.getElementById("location").value = "";
    document.querySelector(".overlay").click();
    getIdeas(selectedPersonId);
  } else if (overlayTitle === "Edit Idea") {
    await editIdea(selectedIdeaId, {
      idea: title,
      location: location,
      "person-id": personRef,
    });
    document.getElementById("title").value = "";
    document.getElementById("location").value = "";
    hideOverlay(ev);
    getIdeas(selectedPersonId);
  }
}

function hideOverlay(ev) {
  ev.preventDefault();
  //close dialog after cancel || save data
  if (
    !ev.target.classList.contains("overlay") &&
    ev.target.id != "btnSaveIdea" &&
    ev.target.id != "btnCancelIdea" &&
    ev.target.id != "btnSavePerson" &&
    ev.target.id != "btnCancelPerson"
  )
    return;

  document.querySelector(".overlay").classList.remove("active");
  document
    .querySelectorAll(".overlay dialog")
    .forEach((dialog) => dialog.classList.remove("active"));
}

function showOverlay(ev) {
  ev.preventDefault();
  document.querySelector(".overlay").classList.add("active");
  //check dialogs people || ideas
  const id =
    ev.target.id === "btnAddPerson" || ev.target.id === "editPersonBtn"
      ? "dlgPerson"
      : "dlgIdea";

  document.getElementById(id).className = "active";

  //check button actions
  //add person
  if (ev.target.id === "btnAddPerson") {
    document.getElementById(id).classList.add("active", "add");
    document.querySelector("#dlgPerson h2").textContent = "Add Person";
  }
  //edit person
  if (ev.target.id === "editPersonBtn") {
    document.getElementById(id).classList.add("active", "edit");
    document.querySelector("#dlgPerson h2").textContent = "Edit Person";
  }
  //add idea
  if (ev.target.id === "btnAddIdea") {
    document.getElementById(id).classList.add("active", "add");
    document.querySelector("#dlgIdea h2").textContent = "Add Idea";
  }
  //edit idea
  if (ev.target.id === "editIdeaBtn") {
    document.getElementById(id).classList.add("active", "edit");
    document.querySelector("#dlgIdea h2").textContent = "Edit Idea";
  }
}
