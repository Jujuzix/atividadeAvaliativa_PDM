import { initDB, addRestaurante, getRestaurantes } from './db.js';

document.addEventListener("DOMContentLoaded", async () => {
  await initDB();

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