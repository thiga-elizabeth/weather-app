<script lang="ts">
import { onMount } from 'svelte';

type WeatherData = {
	name: string;
	timezone: number; 
	main: {
		temp: number;
		humidity: number;
	};
	weather: {
		description: string;
		icon: string;
	}[];
};

type ForecastItem = {
	dt: number;
	main: {
		temp: number;
	};
	weather: {
		description: string;
		icon: string;
	}[];
};

type ForecastData = {
	list: ForecastItem[];
};

let city =$state('');
let weather = $state<WeatherData | null>(null);
let forecastData = $state<ForecastData | null>(null);
let loading = $state(false);
let error = $state('');
let islocating = $state(false);
let isLocationWeather = $state(false);
let cityTime = $state('');
let cityDate = $state('');

const dailyForecast = $derived(() => {
	if (!forecastData?.list) return [];

	const days: string[] = [];

	return forecastData.list.filter(item => {
		const date = new Date(item.dt * 1000).toDateString();

		if (days.includes(date)) return false;

		days.push(date);
		return true;
	});
});

async function getLocationWeather() {
	isLocationWeather = true;

	if (!navigator.geolocation) {
		error = "Geolocation is not supported by your browser";
		return;
	}

	try {
		islocating = true;
		error = '';
		weather = null;

navigator.geolocation.getCurrentPosition(
	(position) => {
		void (async () => {
			const { latitude, longitude } = position.coords;

			try {
				const forecastRes = await fetch(
					`/api/weather?lat=${latitude}&lon=${longitude}&forecast=true`
				);

				if (forecastRes.ok) {
					forecastData = await forecastRes.json();
				} else {
					forecastData = null;
				}

				const response = await fetch(
					`/api/weather?lat=${latitude}&lon=${longitude}`
				);


				if (!response.ok) {
					const errData = await response.json();
                    throw new Error(errData.error || "City not found");

				}

				const data: WeatherData = await response.json();
				weather = data;

				cityTime = getCityTime(data.timezone);
				cityDate = getCityDate(data.timezone);
           		city = data.name;

			} catch (err) {
				error = err instanceof Error ? err.message : "An error occurred";
			} finally {
				islocating = false;
			}
		})();
	},
	() => {
		error = "Unable to retrieve your location";
		islocating = false;
	}
);
	} catch (err) {
		error = err instanceof Error ? err.message : "An error occurred";
		islocating = false;
	}
}

function getBackground(condition: string) {
		const text = condition.toLowerCase();

		if (text.includes('rain')) return 'linear-gradient(135deg, #667db6, #0082c8)';
		if (text.includes('clear')) return 'linear-gradient(135deg, #fceabb, #f8b500)';
		if (text.includes('cloud')) return 'linear-gradient(135deg, #bdc3c7, #2c3e50)';
		if (text.includes('snow')) return 'linear-gradient(135deg, #e6dada, #274046)';

		return 'linear-gradient(135deg, #74ebd5, #9face6)';
	}
const background = $derived(() => {
	const description = weather?.weather?.[0]?.description;
	return description
		? getBackground(description)
		: 'linear-gradient(135deg, #74ebd5, #9face6)';
});

$effect(() => {
	document.body.style.background = background();
});

$effect(() => {
	if (!weather?.timezone) return;

	const timezone = weather.timezone; //  capture safely

	const interval = setInterval(() => {
		cityTime = getCityTime(timezone);
	}, 1000);

	return () => clearInterval(interval);
});


function getCityTime(offset: number) {
	const now = new Date();
	const utc = now.getTime() + now.getTimezoneOffset() * 60000;
	const cityTime = new Date(utc + offset * 1000);

	return cityTime.toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
}

function getCityDate(offset: number) {
		const now = new Date();
		const utc = now.getTime() + now.getTimezoneOffset() * 60000;
		const cityDate = new Date(utc + offset * 1000);
		

		return cityDate.toLocaleDateString(undefined, {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
let inputRef: HTMLInputElement;

onMount(() => {
	inputRef?.focus();
});

function capitalize(text: string) {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	async function getWeather() {
	isLocationWeather = false;

	if (!city.trim()) {
		error = "Please enter a city";
		return;
	}

	try {
		loading = true;
		error = '';
		weather = null;
		forecastData = null;

		// forecast
		const forecastRes = await fetch(
			`/api/weather?city=${encodeURIComponent(city.trim())}&forecast=true`
		);

		if (forecastRes.ok) {
			forecastData = await forecastRes.json();
		}

		// current weather
		const response = await fetch(
			`/api/weather?city=${encodeURIComponent(city.trim())}`
		);

		if (!response.ok) {
			const errData = await response.json();
			throw new Error(errData.error || "City not found");
		}

		const data: WeatherData = await response.json();
		weather = data;

		cityTime = getCityTime(data.timezone);
		cityDate = getCityDate(data.timezone);

	} catch (err) {
		error = err instanceof Error ? err.message : "An error occurred";
	} finally {
		loading = false;
	}
}
</script>

<div class="container">

<h1>🌤 Weather App</h1>


<div class="search-box">
	<input
	    bind:this={inputRef}
		placeholder="Enter city"
		bind:value={city}
		oninput={() => (error = '')}
		onkeydown={(e) => {
			if (e.key === 'Enter' && !loading && !islocating) getWeather();
		}}
	/>

	
</div>

<div class="actions">
    <button onclick={getWeather} disabled={loading || islocating || !city.trim()}>
		{loading ? "Loading..." : "Get Weather"}
	</button>
	<button onclick={getLocationWeather} disabled={loading ||islocating}>
	{islocating ? "Getting location..." : "📍 Use My Location"}
 </button>

</div>

{#if islocating} 
	<p class="status">Getting your location...</p>
{/if}

{#if loading}
	<p class="status">Loading...</p>
{/if}

{#if error}
	<p class="error">{error}</p>
{/if}

 {#if !weather && !loading && !islocating && !error}
	<p>Search for a city or use your location 🌍</p>
 {/if}


{#if weather }
	<div class="weather-card">
		<h2>
			{capitalize(weather.name)}
	        {#if isLocationWeather}(Your Location){/if}
		</h2>

		{#if forecastData?.list}
	      <div class="forecast">
		      {#each dailyForecast().slice(0, 5) as item, i (item.dt)}
			     <div class="forecast-item {i === 0 ? 'active':''} ">
				  <p>
	                {new Date(item.dt * 1000).toLocaleDateString(undefined, {
		              weekday: 'short',
					  day: 'numeric',
					  month: 'short'
	                })}
                 </p> 
				 <img
                   src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                   alt="weather icon"
                 />
				   <p>{item.main.temp}°C</p>
			</div>
		{/each}
	</div>
{/if}

	<img
		class="weather-icon"
		src={`https://openweathermap.org/img/wn/${weather.weather?.[0].icon}@2x.png`}
		alt={weather.weather?.[0].description}
		onerror={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
	/>
		{#if cityTime}
		<p class="time">⏰ {cityTime}</p>
 {/if}
 {#if cityDate}
				<p class="date">📅 {cityDate}</p>
 {/if}


 
		<div class="weather-info">
				<p>🌡 {weather.main.temp}°C</p>
				<p>☁ {weather.weather?.[0]?.description 
	                   ? capitalize(weather.weather[0].description) 
	                   : ''}
                </p>
				<p>💧 {weather.main.humidity}%</p>
			</div>
 
	</div>
{/if}

</div>

<style>
:global(body) {
	margin: 0;
	min-height: 100vh;
	font-family: Arial, Helvetica, sans-serif;

    transition: background 0.5s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #74ebd5, #9face6);
}
.container{
	width:90%;
	max-width:400px;
	text-align:center;
}

.forecast {
	display: flex;
	gap: 10px;
	margin-top: 15px;
	overflow-x: auto;
}

.forecast-item {
	background: rgba(255,255,255,0.3);
	padding: 12px;
	border-radius: 10px;
	min-width: 80px;
}

.forecast-item img {
	width: 45px;
	height: 45px;
	margin: 5px 0;
}

.forecast {
	scrollbar-width: none;
}

.forecast::-webkit-scrollbar {
	display: none;
}

.active {
	background: rgba(255,255,255,0.6);
	transform: scale(1.05);
}

  h1 {
		margin-bottom: 20px;
	}
	.search-box{
		display:flex;
		gap:10px;
		margin-bottom: 15px;
	}
	input{
		flex:1;
		padding:10px;
		border-radius:8px;
		border:1px solid #ccc;
	}
	input:focus{
	outline:none;
	border-color:#4cafef;
	box-shadow:0 0 5px rgba(76,175,239,0.5);
}
	button{
		padding:10px 15px;
		border:none;
		border-radius:8px;
		background-color:#4cafef;
		color:white;
		cursor:pointer;
		transition: background-color 0.2s ease;
	}
	button:hover{
		background-color:#3793d6;
	}
	button:disabled{
		background-color:#a0c4e8;
		cursor:not-allowed;
	}
	.status{
		color: #333;
	}
	.error{
		color:red;
		font-weight:500;
	}
	.weather-card{
		margin-top: 15px;
		padding: 20px;
		border-radius: 16px;

		background: rgba(255, 255, 255, 0.35);
		backdrop-filter: blur(10px);

		box-shadow: 0 4px 10px rgba(0,0,0,0.15);
		transition: transform 0.2s ease;
	}
	.weather-card:hover{
		transform: translateY(-5px);
	}
	.weather-icon{
		width: 90px;
		height: 90px;
		margin: 10px auto;
		display: block;
	}
	.time {
	font-weight: 600;
	font-size: 16px;
	letter-spacing: 1px;
}
.date{
	font-size: 14px;
	color:#333;
	margin-bottom: 10px;
}
.weather-info{
	display: flex;
	justify-content: space-around;
	align-items: center;
	margin-top: 15px;
	gap:10px;
}
.weather-info p:first-child {
	font-size: 18px;
	font-weight: bold;
}
.weather-card {
	animation: fadeIn 0.4s ease;
}

.actions {
	display: flex;
	gap: 10px;
	margin-top: 10px;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
@media (max-width: 500px) {

	.search-box {
		flex-direction: column;
	}

	input {
		width: 100%;
	}

	button {
		width: 100%;
	}

	.weather-info {
		flex-direction: column;
		gap: 5px;
	}

	.weather-card {
		padding: 15px;
	}
    h1{
        font-size: 24px;
    }
    p{
        font-size: 14px;
    }
}
</style>