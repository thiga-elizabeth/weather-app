<script lang="ts">
let today = new Date().toLocaleDateString();

function capitalize(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

function getWeatherEmoji(condition: string) {
	if (condition.includes("rain")) return "🌧";
	if (condition.includes("cloud")) return "☁";
	if (condition.includes("clear")) return "☀";
	if (condition.includes("snow")) return "❄";
	return "🌤";
}
type WeatherData = {
	name: string;
	main: {
		temp: number;
		humidity: number;
	};
	weather: {
		description: string;
        icon: string;
	}[];
};

	let city = $state('');
	let weather = $state<WeatherData | null>(null);
	let loading = $state(false);
	let error = $state('');

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

			const data = await response.json();
			weather = data;
		} catch  {
			error = "Could not fetch weather";
			weather = null;
		} finally {
			loading = false;
		}
	}
</script>

<div class="container">

<h1>🌤 Weather App</h1>


<input placeholder="Enter city"
 bind:value={city}
 onkeydown={(e) =>
 {
    if (e.key === 'Enter') {
        getWeather();
    }
 }}
 />
<div class="search-box">
	<input placeholder="Enter city" bind:value={city} />
	<button onclick={getWeather} disabled={loading}>
	{loading ? "Loading..." : "Get Weather"}
</button>

</div>

{#if loading}
	<p>Loading...</p>
{/if}

{#if error}
	<p>{error}</p>
{/if}

{#if weather }
	<div class="weather-card">
		<h2>{weather.name}</h2>

        {#if weather.weather[0].icon}
        <img
                class="weather-icon"
			src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
			alt="weather icon"
		/>
        {/if}
        <p>📅 {today}</p>
        <p>{getWeatherEmoji(weather.weather[0].description)}</p>
		<p>🌡 Temperature: {weather.main.temp} °C</p>
		<p>☁ Condition: { capitalize(weather.weather[0].description) }</p>
		<p>💧 Humidity: {weather.main.humidity}%</p>
	</div>
{/if}

</div>

<style>
:global(body) {
	background: linear-gradient(135deg, #74ebd5, #9face6);
	min-height: 100vh;
	margin: 0;
}
	h1 {
		text-align: center;
		font-family: Arial, sans-serif;
	}

	.container {
		max-width: 400px;
        width:90%;
		margin: auto;
		padding: 20px;
		text-align: center;
		font-family: Arial, sans-serif;
	}

	input {
		padding: 10px;
		width: 70%;
		margin-right: 5px;
		border-radius: 6px;
		border: 1px solid #ccc;
	}
    input:focus {
	outline: none;
	border: 1px solid #4cafef;
	box-shadow: 0 0 5px rgba(76,175,239,0.5);
}

	button {
		padding: 10px 15px;
		background-color: #4cafef;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}

	button:hover {
		background-color: #3793d6;
	}

	.weather-card {
		margin-top: 20px;
		padding: 20px;
		border-radius: 10px;
		background: #f4f4f4;
		box-shadow: 0 4px 10px rgba(0,0,0,0.1);
	}
    .weather-icon {
	width: 90px;
	height: 90px;
    max-width: 100%;
	margin: 10px auto;
	display: block;
}
.search-box {
	display: flex;
	gap: 10px;
	justify-content: center;
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