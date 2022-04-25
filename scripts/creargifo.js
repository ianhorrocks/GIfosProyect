/*
PASOS

- En crear GIFO

1. Click en "Comenzar". Luego se cambia el texto de la pantalla y pop up de permisos.

2. Al dar acceso, la camara aparece y el boton "Grabar" debajo.

3. Click en "Grabar". Comienza la grabacion del gif, el boton cambia a "Finalizar" y muestra el contador de los segundos que lleva.

4. Click en "Finalizar", donde aparecera luego el boton "Subir gifo". Podemos repetir la captura.

5. Click en "Subir gifo". Hago un POST y aparece el overlay con el icono de loading.

6. Gifo subido con exito. Cambia el icono y el texto del overlay. Aparecen los botones para descargar o link.

- Demas funciones. Repetir gifo y calcular tiempo
 
*/

// API KEY ------> 

apiKey = "VR8AeqhAszSq7OQSaY7ql7g9zWZSOGAh";

let btnComenzar = document.getElementById('btn-creargifo-comenzar');
let btnGrabar = document.getElementById('btn-creargifo-grabar');
let btnFinalizar = document.getElementById('btn-creargifo-finalizar');
let btnSubirGifo = document.getElementById('btn-creargifo-subirgifo');

let pasoActivo = document.querySelectorAll('#creargifo-pasos-numero');
let contadorGrabacion = document.getElementById('contador-grabacion');
let repetirCaptura = document.getElementById('contador-repetircaptura');

let overlayCargando = document.getElementById('overlay-video');
let iconoCargando = document.getElementById('overlay-video-icon');
let textoCargando = document.getElementById('overlay-video-parrafo');
let accionesCargando = document.getElementById('overlay-video-actions');
let overlayActions = document.getElementById('overlay-video-actions');

let recorder;
let blob;
let dateStarted;

let form = new FormData();
let misGifosArray = [];
let misGifosString = localStorage.getItem("misGifos");

let video = document.getElementById('grabacion-video');
let gifGrabado = document.getElementById('gif-grabado');


// 1. y 2.
btnComenzar.addEventListener('click', comenzarGifo);

function comenzarGifo() {

    btnComenzar.style.display = "none";

    let tituloGrabar = document.getElementById('titulo-grabargifo');
    let textoGrabar = document.getElementById('texto-grabargifo');
    tituloGrabar.innerHTML = "¿Nos das acceso </br>a tu cámara?";
    textoGrabar.innerHTML = "El acceso a tu camara será válido sólo </br>por el tiempo en el que estés creando el GIFO."

    pasoActivo[0].classList.add('paso-activo');

    //funcion pedir permisos camara
    navigator.mediaDevices.getUserMedia({ audio: false, video: { width: 480, height: 320 } })

        //doy acceso: aparece la camara y el boton GRABAR. paso 2 activo
        .then(function (mediaStream) {
            //borro el texto
            tituloGrabar.style.display = "none";
            textoGrabar.style.display = "none";
            btnGrabar.style.display = "block";

            pasoActivo[0].classList.remove('paso-activo');
            pasoActivo[1].classList.add('paso-activo');

            //aparece el video
            video.style.display = "block";
            video.srcObject = mediaStream;
            video.onloadedmetadata = function (e) {
                video.play();
            };

            recorder = RecordRTC(mediaStream, {
                type: 'gif'
            });
        })


}

// 3.
btnGrabar.addEventListener('click', grabarGifo);

function grabarGifo() {

    recorder.startRecording();
    console.log("grabando gif");

    btnGrabar.style.display = "none";
    btnFinalizar.style.display = "block";

    contadorGrabacion.style.display = "block";
    repetirCaptura.style.display = "none";

    //contador
    dateStarted = new Date().getTime();

    (function looper() {
        if (!recorder) {
            return;
        }
        contadorGrabacion.innerHTML = calculateTimeDuration((new Date().getTime() - dateStarted) / 1000);
        setTimeout(looper, 1000);
    })();
}


// 4.

btnFinalizar.addEventListener('click', finalizarGifo);

function finalizarGifo() {

    console.log("gif terminado");

    btnFinalizar.style.display = "none";
    btnSubirGifo.style.display = "block";

    contadorGrabacion.style.display = "none";
    repetirCaptura.style.display = "block";

    recorder.stopRecording(function () {
        video.style.display = "none";
        gifGrabado.style.display = "block";

        blob = recorder.getBlob();
        gifGrabado.src = URL.createObjectURL(recorder.getBlob());

        form.append('file', recorder.getBlob(), 'myGif.gif');
        form.append('api_key', apiKey);
    });

}



//5: clickeo SUBIR GIFO: aparece overlay con icono loading y texto. paso 3 activo
btnSubirGifo.addEventListener('click', subirGifo);

function subirGifo() {

    //muestro pantalla cargando y paso activo
    overlayCargando.style.display = "flex";
    btnSubirGifo.style.display = "none";
    pasoActivo[1].classList.remove('paso-activo');
    pasoActivo[2].classList.add('paso-activo');
    repetirCaptura.style.display = "none";

    fetch(`https://upload.giphy.com/v1/gifs`, {
        method: 'POST',
        body: form,
    })

        .then(response => {
            return response.json();
        })

        // 6.
        .then(objeto => {
            console.log(objeto);
            let miGifId = objeto.data.id;

            //muestro elementos del DOM subiendo gifo
            accionesCargando.style.display = "block";
            iconoCargando.setAttribute("src", "./assets/check.svg");
            textoCargando.innerText = "GIFO subido con éxito";
            overlayActions.innerHTML = `
                <button class="overlay-video-button" id="btn-creargifo-descargar" onclick="descargarGifCreado('${miGifId}')">
                <img src="./assets/icon-download.svg" alt="download">
                </button>
                <button class="overlay-video-button" id="btn-creargifo-link">
                <img src="./assets/icon-link.svg" alt="link">
                </button>
                `;

            //si en el local storage no hay nada, el array queda vacio
            if (misGifosString == null) {
                misGifosArray = [];

            } else {
                //si tengo contenido, necesito parsearlo para agregar uno nuevo
                misGifosArray = JSON.parse(misGifosString);
            }

            misGifosArray.push(miGifId);
            //vuelvo a pasar a texto el array para subirlo al LS
            misGifosString = JSON.stringify(misGifosArray);
            localStorage.setItem("misGifos", misGifosString);
        })

        .catch(error => console.log("error al subir gif a GIPHY" + error))
}

//FUNCION DESCARGAR GIF
async function descargarGifCreado(gifImg) {
    let blob = await fetch(gifImg).then( img => img.blob());;
    invokeSaveAsDialog(blob, "migifo.gif");
}

//FUNCION REPETIR CAPTURA
repetirCaptura.addEventListener('click', repetirGifo);

function repetirGifo() {
    recorder.clearRecordedData();
    console.log("re-grabando gif");

    repetirCaptura.style.display = "none";

    // sacar boton subir gifo
    btnSubirGifo.style.display = "none";

    // se va la imagen
    gifGrabado.style.display = "none";

    // funciones comenzar gifo pero sin texto
    // aparece boton grabar gifo
    btnGrabar.style.display = "block";

    // funcion pedir permisos camara
    navigator.mediaDevices.getUserMedia({ audio: false, video: { width: 480, height: 320 } })

        // doy acceso: aparece la camara y el boton GRABAR. paso 2 activo
        .then(function (mediaStream) {

            //aparece el video
            video.style.display = "block";
            video.srcObject = mediaStream;
            video.onloadedmetadata = function (e) {
                video.play();
            };

            recorder = RecordRTC(mediaStream, {
                type: 'gif'
            });
        })
}

//FUNCION CALCULAR TIEMPO

function calculateTimeDuration(secs) {
    var hr = Math.floor(secs / 3600);
    var min = Math.floor((secs - (hr * 3600)) / 60);
    var sec = Math.floor(secs - (hr * 3600) - (min * 60));

    if (min < 10) {
        min = "0" + min;
    }

    if (sec < 10) {
        sec = "0" + sec;
    }

    return hr + ':' + min + ':' + sec;
}