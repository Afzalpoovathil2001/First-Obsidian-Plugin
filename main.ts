import {
	App,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from 'obsidian';

interface MovieSearcherSettings {
	tmdbApiKey: string;
}

const DEFAULT_SETTINGS: MovieSearcherSettings = {
	tmdbApiKey: '',
};
//this is for first input tab.
class MovieSearchModal extends Modal {
	onSubmit: (movieTitle: string) => void;

	constructor(app: App, onSubmit: (movieTitle: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl('h2', { text: 'Search for a movie' });

		const input = contentEl.createEl('input', {
			type: 'text',
			placeholder: 'Enter movie title...',
		});

		input.style.width = '100%';

		const button = contentEl.createEl('button', {
			text: 'Search',
		});

		button.style.marginTop = '10px';

		button.addEventListener('click', () => {
			const movieTitle = input.value.trim();

			if (!movieTitle) {
				new Notice('Please enter a movie title.');
				return;
			}

			this.onSubmit(movieTitle);
			this.close();
		});

		input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				button.click();
			}
		});

		input.focus();
	}

	onClose() {
		this.contentEl.empty();
	}
}
//this is for second modal that shows the results of the search.
class MovieResultsModal extends Modal {
	results: any[];
	onSelect: (movie: any) => void;

	constructor(
		app: App,
		results: any[],
		onSelect: (movie: any) => void,
	) {
		super(app);
		this.results = results;
		this.onSelect = onSelect;
	}

	onOpen() {
	const { contentEl } = this;

	contentEl.createEl('h2', { text: 'Select a movie' });

	if (this.results.length === 0) {
		contentEl.createEl('p', {
			text: 'No movies found.',
		});

		const doneButton = contentEl.createEl('button', {
			text: 'Okay',
		});

		doneButton.style.marginTop = '10px';

		doneButton.addEventListener('click', () => {
			this.close();
		});

		return;
	}

	for (const movie of this.results) {
		const year = movie.release_date
			? movie.release_date.substring(0, 4)
			: 'Unknown year';

		const item = contentEl.createEl('div');

		item.style.padding = '10px';
		item.style.cursor = 'pointer';
		item.style.borderBottom =
			'1px solid var(--background-modifier-border)';

		item.createEl('div', {
			text: movie.title,
		});

		item.createEl('small', {
			text: `${year}  •  TMDB ID: ${movie.id}`,
		});

		if (movie.overview) {
			item.createEl('p', {
				text: movie.overview,
			});
		}

		item.addEventListener('click', () => {
			this.onSelect(movie);
			this.close();
		});
	}
}

	onClose() {
		this.contentEl.empty();
	}
}
//this is for the settings tab.
class MovieSearcherSettingTab extends PluginSettingTab {
	plugin: MovieSearcherPlugin;

	constructor(app: App, plugin: MovieSearcherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', {
			text: 'Movie Searcher Settings',
		});

		new Setting(containerEl)
			.setName('TMDB API key')
			.setDesc('Enter your TMDB API key.')
			.addText((text) =>
				text
					.setPlaceholder('Enter API key')
					.setValue(this.plugin.settings.tmdbApiKey)
					.onChange(async (value) => {
						this.plugin.settings.tmdbApiKey = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
//this is the main plugin class.
// //I'm using TMDB's V4 API, which requires a Bearer token for authorization.
// It is a API Read Access Token from TMDB account settings.
export default class MovieSearcherPlugin extends Plugin {
  async searchTMDB(movieTitle: string) {
	const apiKey = this.settings.tmdbApiKey;
//first check for the movie title.
	if (!apiKey) {
		new Notice('TMDB API key is not configured.');
		return;
	}

	const url =
		'https://api.themoviedb.org/3/search/movie?query=' +
		encodeURIComponent(movieTitle);

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
			accept: 'application/json',
		},
	});

	if (!response.ok) {
		new Notice(`TMDB request failed: ${response.status}`);
		return;
	}
//second check for the movie id and get the details of the movie.
  async getMovieDetails(movieId: number) {
	const apiKey = this.settings.tmdbApiKey;

	if (!apiKey) {
		new Notice('TMDB API key is not configured.');
		return;
	}

	const url =
		`https://api.themoviedb.org/3/movie/${movieId}` +
		'?append_to_response=credits,external_ids,release_dates';

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
			accept: 'application/json',
		},
	});

	if (!response.ok) {
		new Notice(`TMDB details request failed: ${response.status}`);
		return;
	}

	const movie = await response.json();

	console.log('Full movie details:', movie);

	new Notice(`Loaded: ${movie.title}`);
}

	const data = await response.json();

	console.log('TMDB response:', data);

	new MovieResultsModal(
		this.app,
		data.results,
		(movie) => {
			console.log('Selected movie:', movie);

			new Notice(
				`Selected: ${movie.title} (${movie.release_date?.substring(0, 4) ?? 'N/A'})`,
			);
		},
	).open();
}
//this is to add the command to the command palette.
	settings: MovieSearcherSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(
			new MovieSearcherSettingTab(this.app, this),
		);

		this.addCommand({
			id: 'movie-searcher-test',
			name: 'Search for movie',
			callback: () => {
				new MovieSearchModal(this.app, async (movieTitle) => {
	      await this.searchTMDB(movieTitle);
        }).open();
			},
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

function getMovieDetails(movieId: any, number: any) {
  throw new Error('Function not implemented.');
}
