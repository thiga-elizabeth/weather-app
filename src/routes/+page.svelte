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

let city =$state('');
let weather = $state<WeatherData | null>(null);
let loading = $state(false);
let error = $state('');

let cityTime = $state('');
let cityDate = $state('');

function getBackground(condition: string) {
		const text = condition.toLowerCase();

		if (text.includes('rain')) return 'linear-gradient(135deg, #667db6, #0082c8)';
		if (text.includes('clear')) return 'linear-gradient(135deg, #fceabb, #f8b500)';
		if (text.includes('cloud')) return 'linear-gradient(135deg, #bdc3c7, #2c3e50)';
		if (text.includes('snow')) return 'linear-gradient(135deg, #e6dada, #274046)';

		return 'linear-gradient(135deg, #74ebd5, #9face6)';
	}
const background = $derived(
	weather && weather.weather?.length
		? getBackground(weather.weather[0].description)
		: 'linear-gradient(135deg, #74ebd5, #9face6)'
);
$effect(() => {
	document.body.style.background = background;
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

onMount(() => {
	const interval = setInterval(() => {
		if (weather) {
			cityTime = getCityTime(weather.timezone);
		}
	}, 1000);

	return () => clearInterval(interval);
});

function capitalize(text: string) {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	async function getWeather() {
        if (!city.trim()) {
            error = "Please enter a city";
            
            return;
        }
		try {
			loading = true;
			error = '';
            weather = null;

			const apiKey = "6139232b6007e30d97e4b41878c84085";

			const url =
				`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error("City not found");
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
		placeholder="Enter city"
		bind:value={city}
		onkeydown={(e) => {
			if (e.key === 'Enter') getWeather();
		}}
	/>

	<button onclick={getWeather} disabled={loading}>
		{loading ? "Loading..." : "Get Weather"}
	</button>
</div>

{#if loading}
	<p class="status">Loading...</p>
{/if}

{#if error}
	<p class="error">{error}</p>
{/if}

{#if weather }
	<div class="weather-card">
		<h2>{capitalize(weather.name)}</h2>

        {#if weather.weather[0].icon}
	<img
		class="weather-icon"
		src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
		alt={weather.weather[0].description}
		onerror={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
	/>
{/if}
		{#if cityTime}
		<p class="time">⏰ {cityTime}</p>
{/if}
{#if cityDate}
				<p class="date">📅 {cityDate}</p>
{/if}
		
		<div class="weather-info">
				<p>🌡 {weather.main.temp}°C</p>
				<p>☁ {capitalize(weather.weather[0].description)}</p>
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
}
.container{
	width:90%;
	max-width:400px;
	text-align:center;
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