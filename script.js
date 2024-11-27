console.log("Lets write JavaScript")

//sidebar menu

const menuOpen = document.getElementById('menu-open');
const menuClose = document.getElementById('menu-close');
const sidebar = document.querySelector('.container .sidebar');

menuOpen.addEventListener('click', () => sidebar.style.left = '0');
menuClose.addEventListener('click', () => sidebar.style.left = '-100%');


let currentSong = new Audio();
let songs;
let currfolder;
let bgColorArr = ['#476a8a', '#a69984', '#a24c34', '#0d4045', '#a67894', '#5547a5'];

function albumColor(arrlength) {
    // console.log(arrlength)
    for (let i = 0; i < arrlength; i++) {
        // console.log(i)
        let colorIndex = i % bgColorArr.length;
        // console.log(colorIndex)
        let childArray = Array.from(document.querySelector(".cardContainer").children);
        childArray[i].style.backgroundColor = bgColorArr[colorIndex]

    }
}



function secondsToMinutes(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

// Ensure the function is defined at the top or before its usage

function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary); // Convert binary data to a base64 encoded string
}

// Now the extractMetadata function can use it

async function extractMetadata(songPath) {
    // Ensure the songPath doesn't contain redundant 'songs/' in the path
    if (songPath.startsWith('/songs/songs/')) {
        songPath = songPath.replace('/songs/songs/', '/songs/');
    }
    try {
        const response = await fetch(songPath);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            jsmediatags.read(blob, {
                onSuccess: (tag) => {
                    const title = tag.tags.title || "Unknown Title";
                    const artist = tag.tags.artist || "Unknown Artist";
                    const coverArt = tag.tags.picture
                        ? `data:${tag.tags.picture.format};base64,${arrayBufferToBase64(tag.tags.picture.data)}`
                        : null; // Fallback image handling
                    resolve({ title, artist, cover: coverArt });
                },
                onError: (error) => {
                    console.error("Error reading tags:", error);
                    resolve({ title: "Unknown Title", artist: "Unknown Artist", cover: "assets/default-cover.jpg" }); // Return fallback metadata
                },
            });
        });
    } catch (error) {
        console.error("Failed to fetch or process file:", error);
        return { title: "Unknown Title", artist: "Unknown Artist", cover: null };
    }
}


async function getSongs(folder) {
    currfolder = folder.startsWith("songs/") ? folder : `songs/${folder}`; // Ensure consistent folder paths
    let a = await fetch(`/${currfolder}`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(decodeURIComponent(element.href.split(`/${currfolder}/`).pop()));
        }
    }

    // Show all the songs in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    let songPl = document.getElementsByClassName("music-list")[0];
    songPl.innerHTML = "";

    for (const song of songs) {
        const metadata = await extractMetadata(`/songs/${currfolder}/${song}`);
        const coverArt = metadata.cover || "assets/default-cover.jpg"; // Fallback
        const artist = metadata.artist || "Unknown Artist";
        const title = metadata.title || song.replaceAll("%20", " ");

        songUL.innerHTML = songUL.innerHTML + `<li>
                            <img class="invert" src="img/music.svg" alt="musicicon">
                            <div class="musicinfo">
                                <div>${song}</div>
                            </div>
                            </li>`;

        songPl.innerHTML = songPl.innerHTML + `<div class="music-item">
                                <div class="info">
                                    <img src="${coverArt}" alt="Cover Art">
                                    <div class="details">
                                         <h5>${song}</h5>
                                         <p>${artist}</p>
                                    </div>
                                </div>
                                 
                                <div class="icon">
                                    <i class='bx bxs-right-arrow playIcon'></i>
                                </div> 
                            </div>`;
    }

    // Attach event listener to each song in the playlist
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e) => {
        e.addEventListener("click", (element) => {
            console.log(e.querySelector(".musicinfo").firstElementChild.innerHTML);
            playMusic(e.querySelector(".musicinfo").firstElementChild.innerHTML)
        });
    });

    return songs;
}

let currentSongIndex = -1; // **NEW** - Track the index of the current song

const playMusic = (track, pause = false) => {
    // Check if track already ends with '.mp3', only add it if it's missing
    if (!track.endsWith('.mp3')) {
        track += '.mp3';
    }

    // Now, construct the full song path
    const trackPath = `/${currfolder}/${encodeURIComponent(track)}`;

    // Check if the track path is correct
    console.log("Track path:", trackPath);

    currentSong.src = trackPath;

    if (!pause) {
        currentSong.play();
        play.src = "assets/pause.png";
    }

    // **NEW** - Update the currentSongIndex when a song is played
    currentSongIndex = songs.indexOf(track); // Update index of the current song

    // Get song metadata (use extractMetadata to get title, artist, and cover)
    extractMetadata(trackPath).then(metadata => {
        const coverArt = metadata.cover || "assets/default-cover.jpg"; // Fallback cover art
        const artist = metadata.artist || "Unknown Artist";
        const title = metadata.title || track.replaceAll("%20", " ");

        // Update the top section of the music player with song details
        document.querySelector(".music-player .song-info img").src = coverArt;
        document.querySelector(".music-player .song-name").innerHTML = title;
        document.querySelector(".music-player .artist-name").innerHTML = artist;

        // Update the song description in the player
        // document.querySelector(".description").innerHTML = decodeURIComponent(track.split(".mp3")[0]);
        document.querySelector(".progress").innerHTML = `<p id="startTime">00:00</p>
        <input type="range" class="cursor" name="seekbar" id="seekbar">
        <p id="endTime">00:00</p>`;
    });
};

async function displayAlbums() {
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let albumMenu = document.querySelector(".albumMenu");
    let array = Array.from(anchors);
    // Loop through the albums and display them
    for (let index = 1; index < array.length; index++) {
        const e = array[index];
        let folder = e.href.split("/").slice(-2)[0];

        // Fetch album info
        let albumInfo = await fetch(`/songs/${folder}/info.json`);
        let albumDetails = await albumInfo.json();

        // Add album to card container
        cardContainer.innerHTML += `
            <div class="musicitem" data-folder="${folder}">
                <p>${albumDetails.title}</p> 
            </div>`;
        albumMenu.innerHTML += `<div class="musicitem flex cursor" data-folder="${folder}">
        <i class="bx bxs-photo-album"></i>        
        <p>${albumDetails.title}</p> 
            </div>`

    }

    albumColor(array.length - 1);

    let trending = document.querySelector(".trending");
    let musicList = document.querySelector(".music-list");

    // Add event listeners for album clicks
    Array.from(document.getElementsByClassName("musicitem")).forEach(e => {
        e.addEventListener("click", async (item) => {
            let folderContainer = item.currentTarget.dataset.folder;

            // Get songs of the clicked album
            let songs = await getSongs(`songs/${folderContainer}`);

            // Fetch album details
            let albumInfo = await fetch(`/songs/${folderContainer}/info.json`);
            let albumDetails = await albumInfo.json();

            // Update trending section
            trending.innerHTML = `
                <div class="left">
                    <h5>Trending New Song</h5>
                    <div class="info">
                        <h2>${albumDetails.title}</h2>
                        <h4>${albumDetails.description}</h4>
                        <h5>63 Million Plays</h5>
                        <div class="buttons">
                            <button id="listenNow">Listen Now</button>
                        </div>
                    </div>
                </div>
                <img src="/songs/${folderContainer}/cover.jpg" alt="${albumDetails.title}">`;
                
                // Populate the music list with songs
            let songU = document.querySelector(".music-list");
            songU.innerHTML = ""; // Clear existing songs

            if (songs.length === 0) {
                 // Stop music player and reset play button if no songs in album
            play.src = "assets/play.png"; // Reset play button
            currentSong.pause();
                // Display "No songs in album" message
                songU.innerHTML = `
        <div class="no-songs">
            <h5>No songs in this album</h5>
        </div>`;
                
            }
            else{
            // Play the first song automatically
            play.src = "assets/play.png";
            playMusic(songs[0], true);

            // Handle Listen Now button click
            let listenNow = document.getElementById("listenNow");
            listenNow.addEventListener("click", () => {
                console.log("listen now clicked");
                play.src = "assets/play.png";
                playMusic(songs[0]);
            });
            
            
            // Loop through the songs and get metadata using extractMetadata
            for (const song of songs) {
                let songPath = `/songs/${folderContainer}/${song}`;

                // Call the extractMetadata function to get song metadata
                const songMetadata = await extractMetadata(songPath);
                if (songMetadata) {
                    const { title, artist, cover } = songMetadata;

                    // Add song to the playlist
                    songU.innerHTML += `
                        <div class="music-item">
                            <div class="info">
                                <img src="${cover}" alt="${title}">
                                <div class="details">
                                    <h5>${song}</h5>
                                    <p>${artist}</p>
                                </div>
                            </div>
                            <div class="icon">
                                <i class='bx bxs-right-arrow playIcon'></i>
                            </div>
                        </div>`;
                }
            }

            // Handle click on individual song
            Array.from(songU.getElementsByClassName("music-item")).forEach(songElement => {
                songElement.addEventListener("click", async () => {
                    const songName = songElement.querySelector("h5").textContent;
                    const song = songs.find(s => decodeURI(s) === songName);
                    playMusic(song);
                });
            });
        }
        });
    });
}




async function main() {


    //Display all the albums on the page
    displayAlbums();

    //Attach an event listener to play,next and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "assets/pause.png"
        }
        else {
            currentSong.pause()
            play.src = "assets/play.png"
        }
    })

    //eventlistener for timeupdate event
    currentSong.addEventListener(("timeupdate"), () => {
        const startTimeElement = document.getElementById("startTime");
        const endTimeElement = document.getElementById("endTime");
        if (startTimeElement && endTimeElement) {
            startTimeElement.innerHTML = `${secondsToMinutes(currentSong.currentTime)}`
            endTimeElement.innerHTML = `${secondsToMinutes(currentSong.duration)}`
        }
        // Handle cases where elements are not yet available


        const percentage = (currentSong.currentTime / currentSong.duration) * 100;
        document.getElementById("seekbar").value = percentage;

        // Add an event listener to seek music
        const seekBar = document.getElementById('seekbar');
        seekBar.addEventListener("click", (e => {
            e.stopPropagation();
            console.log("seekbar clicked")
            // const clickX = e.offsetX;
            // const barWidth = seekBar.offsetWidth;
            // const duration = currentSong.duration;
            // const seekTime = (clickX / barWidth) * duration;
            // currentSong.currentTime = seekTime;
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
            document.getElementById("seekbar").value = percent;
            currentSong.currentTime = ((currentSong.duration) * percent) / 100
        }))


    })


    const previous = document.getElementById("previous");
    const next = document.getElementById("next");

    // **NEW** - Update the "Previous" button to use currentSongIndex
    previous.addEventListener("click", () => {
        if (currentSongIndex > 0) { // Check if it's not the first song
            const prevSong = songs[currentSongIndex - 1]; // Get the previous song
            playMusic(prevSong); // Play the previous song
        }
    });

    // **NEW** - Update the "Next" button to use currentSongIndex
    next.addEventListener("click", () => {
        if (currentSongIndex < songs.length - 1) { // Check if it's not the last song
            const nextSong = songs[currentSongIndex + 1]; // Get the next song
            playMusic(nextSong); // Play the next song
        }
    });

    //Add an event to volume

    document.querySelector(".volumerange").getElementsByTagName("input")[0].addEventListener("change", e => {
        console.log("setting volume to ", e.target.value, "/100")
        currentSong.volume = parseInt(e.target.value) / 100
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("img/mute.svg", "img/volume.svg")
        }
        if (currentSong.volume == 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("img/volume.svg", "img/mute.svg")
        }
    })




    document.querySelector(".music-list").addEventListener("click", (event) => {
        const target = event.target;
        if (target.classList.contains("playIcon")) {
            const musicClicked = target.closest('.music-item').querySelector(".details").firstElementChild.textContent;
            playMusic(musicClicked);
        }
    });


}
//Add an event listener to mute volume
document.querySelector(".volume>img").addEventListener("click", (e) => {
    if (e.target.src.includes("img/volume.svg")) {
        e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg")
        currentSong.volume = 0
        document.querySelector(".range").getElementsByTagName("input")[0].value = 0;

    }
    else {
        e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg")
        e.target.src = "img/volume.svg"
        currentSong.volume = 0.1
        document.querySelector(".range").getElementsByTagName("input")[0].value = 10

    }
})



const seeAllbtn = document.getElementById("seeAll_1");
const contentCardContainer = document.getElementsByClassName("cardContainer")[0];
seeAllbtn.addEventListener("click", () => {
    // console.log( document.getElementsByClassName("cardContainer"))
    contentCardContainer.classList.toggle("overflow-auto");
    seeAllbtn.textContent = contentCardContainer.classList.contains("overflow-auto") ? "See Less" : "See All";
})

const seeAllbtn2 = document.getElementById("seeAll_2");
const musicListContainer = document.getElementsByClassName("music-list")[0];
seeAllbtn2.addEventListener("click", () => {
    // console.log( document.getElementsByClassName("music-list"))
    musicListContainer.classList.toggle("overflow-auto");
    seeAllbtn2.textContent = musicListContainer.classList.contains("overflow-auto") ? "See Less" : "See All";
})





main()