const Header = {
    init() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const favoritesBtn = document.getElementById('favoritesBtn');

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.onSearch();
            });
            searchInput.addEventListener('input', (e) => this.onSearchInput(e.target.value));
        }

        if (searchBtn) searchBtn.addEventListener('click', () => this.onSearch());
        if (favoritesBtn) favoritesBtn.addEventListener('click', () => this.onFavoritesClick());
    },

    onSearch() { },
    onSearchInput(value) { },
    onFavoritesClick() { }
};

const Hero = {
    toggle(show) {
        const banner = document.getElementById('heroBanner');
        if (banner) {
            if (show) banner.classList.remove('hidden');
            else banner.classList.add('hidden');
        }
    }
};

const Filters = {
    init() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.onFilterClick(btn.dataset);
            });
        });
    },

    onFilterClick(dataset) {
        
    }
};

const MovieCard = {
    render(movie) {
        const template = document.getElementById('movie-card-template');
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.movie-card');

        card.dataset.id = movie.movie_id;

        const poster = clone.querySelector('.movie-poster');
        poster.src = movie.poster_path;
        poster.alt = movie.movie_title;

        const infoIcon = clone.querySelector('.info-icon');
        infoIcon.dataset.id = movie.movie_id;

        const favIcon = clone.querySelector('.fav-icon');
        favIcon.dataset.id = movie.movie_id;
        const is_fav = Storage.is_favorite(movie.movie_id);
        if (is_fav) {
            favIcon.classList.add('active');
            favIcon.querySelector('i').className = 'fa-solid fa-heart';
        }

        clone.querySelector('.movie-title').textContent = movie.movie_title;
        clone.querySelector('.year').textContent = movie.release_year;
        clone.querySelector('.rating span').textContent = movie.rating_score;

        return clone;
    }
};

const MovieGrid = {
    render(movies, isFavorites = false) {
        if (isFavorites && movies.length === 0) {
            const template = document.getElementById('empty-favorites-template');
            return template.innerHTML;
        }

        if (movies.length === 0) {
            const template = document.getElementById('no-results-template');
            return template.innerHTML;
        }

        const fragment = document.createDocumentFragment();
        movies.forEach(movie => {
            fragment.appendChild(MovieCard.render(movie));
        });

        const tempDiv = document.createElement('div');
        tempDiv.appendChild(fragment);
        return tempDiv.innerHTML;
    },

    init(movies, onMovieClick, onFavClick, onInfoClick) {
        const grid = document.getElementById('movieGrid');

        grid.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.fav-icon') || e.target.closest('.info-icon')) return;
                onMovieClick(card.dataset.id);
            });
        });

        grid.querySelectorAll('.info-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                onInfoClick(icon.dataset.id);
            });
        });

        grid.querySelectorAll('.fav-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                onFavClick(icon.dataset.id, icon);
            });
        });
    }
};

const MovieModal = {
    renderBody(movie) {
        const template = document.getElementById('movie-modal-template');
        const clone = template.content.cloneNode(true);
        const is_fav = Storage.is_favorite(movie.movie_id);

        const poster = clone.querySelector('.modal-poster');
        poster.src = movie.poster_path;
        poster.alt = movie.movie_title;

        clone.querySelector('h2').textContent = movie.movie_title;
        clone.querySelector('.modal-year').textContent = `Yil: ${movie.release_year}`;
        clone.querySelector('.rating span').textContent = movie.rating_score;
        clone.querySelector('.modal-overview').textContent = movie.plot_summary;

        const favBtn = clone.querySelector('.toggle-fav');
        favBtn.dataset.id = movie.movie_id;
        favBtn.textContent = is_fav ? "Olib tashlash" : "Saqlash";

        return clone;
    },

    show(movie, onFavToggle) {
        const modal = document.getElementById('movieModal');
        const modalBody = document.getElementById('modalBody');

        if (!modal || !modalBody) return;

        modalBody.innerHTML = '';
        modalBody.appendChild(this.renderBody(movie));
        modal.style.display = 'block';

        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.onclick = () => modal.style.display = 'none';

        window.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };

        const watchBtn = modal.querySelector('#watchBtn');
        watchBtn.onclick = () => {
            const query = encodeURIComponent(`${movie.movie_title} ${movie.release_year} trailer`);
            window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
        };

        const favBtn = modal.querySelector('.toggle-fav');
        favBtn.onclick = () => {
            onFavToggle(movie, favBtn);
        };
    }
};

const App = {
    current_media_type: 'movie',
    current_category: 'popular',

    init() {
        this.initEventListeners();
        this.loadContent(this.current_media_type, this.current_category);
    },

    initEventListeners() {
        Header.onSearch = () => this.performSearch();
        Header.onSearchInput = (val) => this.handleSearchInput(val);
        Header.onFavoritesClick = () => this.showFavorites();
        Header.init();

        Filters.onFilterClick = (dataset) => this.handleFilter(dataset);
        Filters.init();
    },

    async loadContent(type, category) {
        this.showLoader();
        let contents = [];
        try {
            if (category === 'trending') {
                contents = await API.get_trending();
            } else if (category === 'game') {
                const r1 = await API.search_content('game');
                const r2 = await API.search_content('gaming');
                contents = [...r1, ...r2].filter((v, i, a) => a.findIndex(t => t.movie_id === v.movie_id) === i);
            } else {
                contents = await API.fetch_movies(type, category);
            }
            this.renderMovies(contents);
        } catch (error) {
            console.error("Load error:", error);
            this.renderMovies([]);
        }
    },

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        Hero.toggle(query.length === 0);

        if (query.length > 2) {
            this.showLoader();
            const results = await API.search_content(query);
            this.renderMovies(results);
        } else if (query.length === 0) {
            this.loadContent(this.current_media_type, 'popular');
        }
    },

    searchTimer: null,
    handleSearchInput(val) {
        clearTimeout(this.searchTimer);
        if (val.trim().length > 2) {
            this.searchTimer = setTimeout(() => this.performSearch(), 600);
        } else if (val.trim().length === 0) {
            this.loadContent(this.current_media_type, 'popular');
        }
    },

    async handleFilter(dataset) {
        const { category, genre } = dataset;
        this.showLoader();
        Hero.toggle(true); 
        let contents = [];

        if (genre) {
            contents = await API.fetch_by_genre(genre);
            this.current_media_type = 'movie';
        } else if (category === 'trending') {
            contents = await API.get_trending();
        } else if (category === 'game') {
            const r1 = await API.search_content('game');
            const r2 = await API.search_content('gaming');
            contents = [...r1, ...r2].filter((v, i, a) => a.findIndex(t => t.movie_id === v.movie_id) === i);
        } else {
            this.current_media_type = category;
            contents = await API.fetch_movies(category, 'popular');
        }

        this.renderMovies(contents);
        document.getElementById('searchInput').value = '';
        Hero.toggle(true);
    },

    showFavorites() {
        Hero.toggle(false); 
        const saved = Storage.get_favorites();
        this.renderMovies(saved, true);
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('searchInput').value = '';
    },

    renderMovies(movies, isFavView = false) {
        this.hideLoader();
        const grid = document.getElementById('movieGrid');
        grid.innerHTML = MovieGrid.render(movies, isFavView);

        MovieGrid.init(movies,
            (id) => this.handleMovieClick(id, movies),
            (id, icon) => this.handleFavToggle(id, icon, movies, isFavView),
            (id) => this.handleMovieClick(id, movies)
        );
    },

    handleMovieClick(id, list) {
        const movie = list.find(m => m.movie_id == id);
        if (movie) MovieModal.show(movie, (m, btn) => this.handleModalFavToggle(m, btn));
    },

    handleFavToggle(id, icon, list, isFavView) {
        const movie_id = parseInt(id);
        const movie = list.find(m => m.movie_id == movie_id);

        if (Storage.is_favorite(movie_id)) {
            Storage.remove_favorite(movie_id);
            icon.classList.remove('active');
            icon.querySelector('i').className = 'fa-regular fa-heart';
            if (isFavView) this.showFavorites();
        } else if (movie) {
            Storage.save_favorite(movie);
            icon.classList.add('active');
            icon.querySelector('i').className = 'fa-solid fa-heart';
        }
    },

    handleModalFavToggle(movie, btn) {
        if (Storage.is_favorite(movie.movie_id)) {
            Storage.remove_favorite(movie.movie_id);
            btn.textContent = 'Saqlash';
        } else {
            Storage.save_favorite(movie);
            btn.textContent = 'Olib tashlash';
        }
        const gridIcon = document.querySelector(`.fav-icon[data-id="${movie.movie_id}"]`);
        if (gridIcon) {
            gridIcon.classList.toggle('active');
            gridIcon.querySelector('i').className = Storage.is_favorite(movie.movie_id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        }
    },

    showLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'block';
        const grid = document.getElementById('movieGrid');
        if (grid) grid.innerHTML = '';
    },

    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
