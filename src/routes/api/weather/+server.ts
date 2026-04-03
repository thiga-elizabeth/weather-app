import { json } from '@sveltejs/kit';
import { PRIVATE_WEATHER_API_KEY } from '$env/static/private';

export async function GET({ url }) {
	const city = url.searchParams.get('city');
	const lat = url.searchParams.get('lat');
	const lon = url.searchParams.get('lon');

	const apiKey = PRIVATE_WEATHER_API_KEY;

	let apiUrl = '';

	// City search
	if (city) {
		apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
	}

	// Location search
	else if (lat && lon) {
		apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
	}

	else {
		return json({ error: 'City or coordinates required' }, { status: 400 });
	}

	try {
		const res = await fetch(apiUrl);

		if (!res.ok) {
			const errData = await res.json();

			return json(
				{ error: errData.message || 'Weather data not found' },
				{ status: res.status }
			);
		}

		const data = await res.json();
		return json(data);

	} catch (err) {
		console.error('Error fetching weather data:', err);
		return json({ error: 'Failed to fetch weather data' }, { status: 500 });
	}
}