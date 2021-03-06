const displayedCities = [];
const baseEndpoint = 'https://api.openweathermap.org/data/2.5/weather';
const apiKey = '18d89992ac2679e69306340c1d27dbaf';
const findBtn = document.querySelector('[type="submit"]'); // the "find" button
const msgInvalidCity = document.querySelector('.city-err'); // the message for invalid city search
const msgLocationDenied = document.querySelector('.loc-err'); // the message when user denied location
const msgSameSearch = document.querySelector('.same-search-err'); // the message when user searches for a city that is already displayed


function handleErrors(res) {
  if (!res.ok) {
    console.log('OH NO!');
    throw Error(res.statusText);
  }
  return res;
}

async function fetchCityData(cityName) {
  try {
    const res = await fetch(`${baseEndpoint}?q=${cityName}&appid=${apiKey}&units=metric`);
    await handleErrors(res);
    await (res => console.log("ok"));
    const data = await res.json();
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function fetchCurrLocationData(lat, lon) {
  try {
    const res = await fetch(`${baseEndpoint}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = await res.json();
    await createCityObj(data, true);
  } catch (error) {
    console.log(error);
  }
}

navigator.geolocation.getCurrentPosition(pos => {
  let lat = pos.coords.latitude;
  let lon = pos.coords.longitude;
  fetchCurrLocationData(lat, lon).catch(handleErrors);
}, err => {
  console.warn(`OH NO! ${err.message}`);
  msgLocationDenied.removeAttribute("hidden");
  document.querySelector('.my-info-section').style.color = "lightgrey"
});


// handle find button click
// fetch this city data from the api
// if the city is invalid - show message
// else - create local city object 
async function handleFind(e) {
  e.preventDefault();
  msgInvalidCity.setAttribute("hidden", true);
  msgSameSearch.setAttribute("hidden", true);
  let searchInput = document.querySelector('.search-input');
  const foundCity = await fetchCityData(searchInput.value).catch(handleErrors);
  if (!foundCity) {
    msgInvalidCity.removeAttribute("hidden");
  }
  else {
    createCityObj(foundCity, false);
    searchInput.value = '';
  }
}

// creates a local object with the data we want from all the information we got from the api
// isMyPos is a boolean that tells if it's the current location - to determine what function to call
async function createCityObj(data, isMyPos) {
  const cityObj = {};
  cityObj.id = data.id;
  cityObj.cityName = data.name;
  cityObj.temperature = data.main.temp;
  cityObj.tempFeelsLike = data.main.feels_like;
  cityObj.weatherDesc = data.weather[0].description;
  cityObj.icon = data.weather[0].icon;
  cityObj.country = data.sys.country;
  cityObj.cityTime = cityTimeFormat(timeZoneToTime(data));
  cityObj.sunrise = formatTime(data.sys.sunrise, data.timezone);
  cityObj.sunset = formatTime(data.sys.sunset, data.timezone);
  let utcTime = timeZoneToTime(data) - data.timezone;
  cityObj.night = isNight(utcTime, data);
  if (isMyPos) {
    displayCurrLocationInfo(cityObj);
    displayedCities.push(cityObj);
  } else handleCreatedCityActions(cityObj);
}

function handleCreatedCityActions(cityObj) {
  isCityAlreadyDisplayed(cityObj)
    ? msgSameSearch.removeAttribute("hidden") &&
    console.log('ohh city already displayed')
    : displayedCities.push(cityObj) &&
    displayFoundCityInfo(cityObj);
}

// returns true if city already exists in the array
function isCityAlreadyDisplayed(cityObj) {
  let res = false;
  displayedCities.forEach(city => city.id === cityObj.id ? res = true : res);
  return res;
}

function formatTime(givenTime, timezone) {
  let time = new Date(formatTimeToSec(givenTime, timezone));
  let hours = "0" + time.getHours();
  let minutes = "0" + time.getMinutes();
  let formattedTime = hours.substr(-2) + ':' + minutes.substr(-2);
  return formattedTime;
}

function formatTimeToSec(givenTime, timezone) {
  let myOffset = new Date().getTimezoneOffset() * 60; //10800
  let time = (givenTime + timezone + myOffset) * 1000;
  return time;
}

function timeZoneToTime(data) {
  let timezone = data.timezone;
  let time = new Date();
  let localTime = time.getTime();
  let localOffset = time.getTimezoneOffset() * 60000;
  let utc = localTime + localOffset;
  let utcTime = utc + (1000 * timezone);
  return utcTime;
}

function cityTimeFormat(timeInSec) {
  time = new Date(timeInSec);
  time = time.toString().slice(16, 21);
  return time;
}

function isNight(cityTime, data) {
  ;
  let sunriseTime = formatTimeToSec(data.sys.sunrise, data.timezone);
  let sunsetTime = formatTimeToSec(data.sys.sunset, data.timezone);
  if (cityTime > sunriseTime && cityTime < sunsetTime) {
    return false;
  }
  else return true;
}


// display info to current location 
function displayCurrLocationInfo(cityObj) {
  document.querySelector('.my-info.location span').textContent = `${cityObj.cityName}, ${cityObj.country}`;
  document.querySelector('.my-info.weather span').textContent = `${cityObj.temperature} \u2103`, `${cityObj.weatherDesc}`;
  document.querySelector('.my-info.sunrise span').textContent = `${cityObj.sunrise}`;
  document.querySelector('.my-info.sunset span').textContent = `${cityObj.sunset}`;
  document.querySelector('.my-info.img').setAttribute("src", `http://openweathermap.org/img/wn/${cityObj.icon}@2x.png`);
  document.querySelector('.my-info.desc').textContent = `${cityObj.weatherDesc}`;
}


// draw city elements and inject them to the DOM
function displayFoundCityInfo(cityObj) {
  const searchedInfoGrid = document.querySelector('.searched-info_cities-grid');
  document.querySelector('.no-searches-msg').style.display = 'none';

  //create elements:
  const cityDiv = document.createElement('div');
  const cityDiv_name = document.createElement('p');
  const cityDiv_time = document.createElement('p');
  const cityDiv_temp = document.createElement('p');
  const cityDiv_icon = document.createElement('img');
  const cityDiv_desc = document.createElement('p');

  giveClassesToElements(cityObj, cityDiv, cityDiv_name, cityDiv_time, cityDiv_temp, cityDiv_icon, cityDiv_desc);
  cityDiv.addEventListener('click', (e) => removeCityDiv(e, cityObj));

  //append children:  
  searchedInfoGrid.appendChild(cityDiv);
  cityDiv.appendChild(cityDiv_name);
  cityDiv.appendChild(cityDiv_time);
  cityDiv.appendChild(cityDiv_temp);
  cityDiv.appendChild(cityDiv_icon);
  cityDiv.appendChild(cityDiv_desc);
}

function giveClassesToElements(cityObj, cityDiv, cityDiv_name, cityDiv_time, cityDiv_temp, cityDiv_icon, cityDiv_desc) {
  cityDiv.classList.add('city-info');
  cityObj.night ? cityDiv.classList.add('night') : cityDiv.classList.add('day');
  cityObj.weatherDesc.includes('rain')
    || cityObj.weatherDesc.includes('drizzle')
    || cityObj.weatherDesc.includes('thunderstorm')
    ? cityDiv.classList.add('rain') : '';
  cityObj.weatherDesc.includes('snow') ? cityDiv.classList.add('snow') : '';
  cityDiv_name.classList.add('city-info-name');
  cityDiv_time.classList.add('city-info-time');
  cityDiv_temp.classList.add('city-info-temp');
  cityDiv_icon.classList.add('city-info-icon');
  cityDiv_desc.classList.add('city-info-desc');
  // add text content:
  cityDiv_name.textContent = `${cityObj.cityName}, ${cityObj.country}`;
  cityDiv_time.textContent = `current time: ${cityObj.cityTime}`;
  cityDiv_temp.textContent = `${cityObj.temperature}\u2103`;
  cityDiv_icon.setAttribute("src", `http://openweathermap.org/img/wn/${cityObj.icon}@2x.png`);
  cityDiv_desc.textContent = `${cityObj.weatherDesc}`;
}

// click on city element handler
function removeCityDiv(e, cityObj) {
  e.target.closest('div').remove();
  let ind = displayedCities.indexOf(cityObj);
  displayedCities.splice(ind, 1);
  if (displayedCities.length === 1) {
    document.querySelector('.no-searches-msg').style.display = 'block';
  }
}

findBtn.addEventListener('click', handleFind);