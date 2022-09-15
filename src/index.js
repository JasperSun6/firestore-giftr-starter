import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA11AtBsjU2Kr_TCGdySvB0IDt2XyfbB7E',
  authDomain: 'stupid-first-project.firebaseapp.com',
  projectId: 'stupid-first-project',
  storageBucket: 'stupid-first-project.appspot.com',
  messagingSenderId: '876050898658',
  appId: '1:876050898658:web:d4d7add948d9a578b948bb',
};
//TODO: replace this config object with your own

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// get a reference to the database
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  //set up the dom events
  document
    .getElementById('btnCancelPerson')
    .addEventListener('click', hideOverlay);
  document
    .getElementById('btnCancelIdea')
    .addEventListener('click', hideOverlay);
  document.querySelector('.overlay').addEventListener('click', hideOverlay);

  document
    .getElementById('btnAddPerson')
    .addEventListener('click', showOverlay);
  document.getElementById('btnAddIdea').addEventListener('click', showOverlay);
});

function hideOverlay(ev) {
  ev.preventDefault();
  document.querySelector('.overlay').classList.remove('active');
  document
    .querySelectorAll('.overlay dialog')
    .forEach((dialog) => dialog.classList.remove('active'));
}
function showOverlay(ev) {
  ev.preventDefault();
  document.querySelector('.overlay').classList.add('active');
  const id = ev.target.id === 'btnAddPerson' ? 'dlgPerson' : 'dlgIdea';
  //TODO: check that person is selected before adding an idea
  document.getElementById(id).classList.add('active');
}
