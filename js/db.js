import { openDB } from "idb";
let db;

async function createDB() {
  try {
    db = await openDB('restaurantesDB', 1, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('restaurantes', {
            keyPath: 'nome'
          });
          store.createIndex('lat-lng', ['lat', 'lng']);
        }
      }
    });
    console.log("Banco de dados aberto!");
  } catch (e) {
    console.error("Erro ao criar o banco de dados: " + e.message);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await createDB();
  if (!db) return;

  const map = L.map("map").setView([-23.5505, -46.6333], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
  
  let selectedLatLng = null;
  const listaRestaurantes = document.getElementById("listaRestaurantes");

  // Carrega os restaurantes do IndexedDB
  const restaurantes = await getRestaurantes();
  restaurantes.forEach(({ nome, lat, lng }) => {
    adicionarRestauranteNaLista(nome, lat, lng);
    adicionarMarcadorNoMapa(nome, lat, lng);
  });

  map.on("click", (e) => {
    selectedLatLng = e.latlng;
    document.getElementById("latitude").textContent = selectedLatLng.lat.toFixed(6);
    document.getElementById("longitude").textContent = selectedLatLng.lng.toFixed(6);
  });

  document.getElementById("salvarRestaurante").addEventListener("click", async () => {
    const nome = document.getElementById("nomeRestaurante").value.trim();

    if (!nome || !selectedLatLng) {
      alert("Selecione um local no mapa e insira um nome!");
      return;
    }

    await addRestaurante({ nome, lat: selectedLatLng.lat, lng: selectedLatLng.lng });

    adicionarRestauranteNaLista(nome, selectedLatLng.lat, selectedLatLng.lng);
    adicionarMarcadorNoMapa(nome, selectedLatLng.lat, selectedLatLng.lng);

    document.getElementById("nomeRestaurante").value = "";
  });

  async function addRestaurante({ nome, lat, lng }) {
    try {
      const tx = await db.transaction('restaurantes', 'readwrite');
      const store = tx.objectStore('restaurantes');
      await store.put({ nome, lat, lng });
      await tx.done;
      console.log("Restaurante salvo com sucesso.");
    } catch (e) {
      console.error("Erro ao adicionar restaurante: " + e.message);
    }
  }

  async function getRestaurantes() {
    try {
      const tx = await db.transaction('restaurantes', 'readonly');
      const store = tx.objectStore('restaurantes');
      return await store.getAll();
    } catch (e) {
      console.error("Erro ao obter restaurantes: " + e.message);
      return [];
    }
  }

  function adicionarRestauranteNaLista(nome, lat, lng) {
    const jaExiste = [...listaRestaurantes.children].some(li =>
      li.textContent.includes(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    );

    if (jaExiste) return;

    const li = document.createElement("li");
    li.textContent = `${nome} (${lat.toFixed(6)}, ${lng.toFixed(6)})`;

    const btn = document.createElement("button");
    btn.textContent = "Ir";
    btn.style.marginLeft = "10px";
    btn.addEventListener("click", () => {
      map.setView([lat, lng], 15);
    });

    li.appendChild(btn);
    listaRestaurantes.appendChild(li);
  }

  function adicionarMarcadorNoMapa(nome, lat, lng) {
    const marker = L.marker([lat, lng]).addTo(map).bindPopup(nome);
    marker.openPopup();
  }
});
