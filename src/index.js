import { initializeApp } from "firebase/app";
import {
  getAuth,
  GithubAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";

import {
  getFirestore,
  collection,
  doc,
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

const auth = getAuth(app);
const provider = new GithubAuthProvider();

setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.log(error);
});

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

  // sign in / sign out button
  const signButton = document.querySelector(".signButton");
  //track when the user logs in or out
  signButton.addEventListener("click", () => {
    if (auth.currentUser) {
      // hide the sign in button
      document.getElementById("btnAddPerson").style.visibility = "hidden";
      document.getElementById("btnAddIdea").style.visibility = "hidden";
      auth.signOut().catch((err) => console.warn(err));
      buildPeople([]);
      buildIdeas([]);
      const ul = document.querySelector(".idea-list");
      ul.innerHTML = "";
    } else {
      attemptLogin();
      // show the sign in button
      document.getElementById("btnAddPerson").style.visibility = "visible";
      document.getElementById("btnAddIdea").style.visibility = "visible";
    }
  });
});

//let the user signup for a Github account through the interface
provider.setCustomParameters({
  allow_signup: "true",
});

// auth state change
auth.onAuthStateChanged(function (user) {
  const signButton = document.querySelector(".signButton");

  if (user) {
    signButton.innerHTML = "Sign Out";
    peopleSnapshot();
    ideasSnapshot();
  } else {
    if (!auth.currentUser) {
      signButton.innerHTML = "Sign In";
    }
  }
});

// sign in popup
function attemptLogin() {
  //try to login with the global auth and provider objects
  signInWithPopup(auth, provider)
    .then((result) => {
      //IF YOU USED GITHUB PROVIDER
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
    })
    .catch((error) => {
      console.log(error);
    });
}

//people onSnapShot
const peopleSnapshot = () => {
  onSnapshot(collection(db, "people"), (snapshot) => {
    people = [];
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

//idea onSnapShot
const ideasSnapshot = () => {
  onSnapshot(collection(db, "gift-ideas"), (snapshot) => {
    ideas = [];
    snapshot.docs.map((doc) => {
      const data = doc.data();
      const giftId = doc.id;
      ideas.push({ giftId, ...data });
      return doc.data();
    });
    buildIdeas(ideas);
  });
  (err) => {
    alert(err);
  };
};

//build people list
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
}

//build idea list
function buildIdeas(ideas) {
  const ul = document.querySelector(".idea-list");
  ul.innerHTML = "";

  if (ideas.length) {
    ul.innerHTML = ideas
      .map((idea) => {
        if (idea["person-id"].id != selectedPersonId) return;
        return `<li class="idea" data-id="${idea.giftId}">
                <label for="chk-${idea.giftId}">
                <input type="checkbox" id="chk-${idea.giftId} class="bought" /> Bought</label>
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

//edit or delete selected person
function handleSelectPerson(ev) {
  const li = ev.target.closest(".person");
  const id = li.getAttribute("data-id");
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
  }
  buildIdeas(ideas);
}

//edit or delete selected idea
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
}

// edit person
const editPerson = async (selectedPersonId, person) => {
  let ref = doc(db, "people", `${selectedPersonId}`);
  await updateDoc(ref, person);
};

//edit idea
const editIdea = async (selectedIdeaId, idea) => {
  let ref = doc(db, "gift-ideas", `${selectedIdeaId}`);
  await updateDoc(ref, idea);
};

//save person after add or edit
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

//save idea after add or edit
async function saveIdea(ev) {
  let title = document.getElementById("title").value;
  let location = document.getElementById("location").value;
  const personRef = doc(db, "people", `${selectedPersonId}`);
  if (!title || !location || !personRef) return;
  const idea = {
    idea: title,
    location,
    "person-id": personRef,
    bought: false,
  };
  if (ev.target.closest(".add")) {
    const docRef = await addDoc(collection(db, "gift-ideas"), idea);
    document.getElementById("title").value = "";
    document.getElementById("location").value = "";
    document.querySelector(".overlay").click();
    idea.id = docRef.id;
  } else if (ev.target.closest(".edit")) {
    await editIdea(selectedIdeaId, {
      idea: title,
      location: location,
      "person-id": personRef,
    });
    document.getElementById("title").value = "";
    document.getElementById("location").value = "";
    hideOverlay(ev);
  }
}

//show overlay
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

//hide overlay
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
