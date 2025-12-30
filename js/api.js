const API = {
        transform_movie(tmdb_movie) {
                return {
                        movie_id: tmdb_movie.id,
                        movie_title: (tmdb_movie.title || tmdb_movie.name || "Noma'lum").toLowerCase(),
                        release_year: (tmdb_movie.release_date || tmdb_movie.first_air_date || '0000').split('-')[0],
                        poster_path: tmdb_movie.poster_path ? `${CONFIG.IMAGE_BASE_URL}${tmdb_movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
                        rating_score: tmdb_movie.vote_average ? tmdb_movie.vote_average.toFixed(1) : '0.0',
                        plot_summary: tmdb_movie.overview || 'Tavsif mavjud emas.',
                        media_type: tmdb_movie.title ? 'movie' : 'tv',
                        is_favorite: Storage.is_favorite(tmdb_movie.id)
                };
        },

        async fetch_movies(type = 'movie', category = 'popular') {
                try {
                        const url = `${CONFIG.BASE_URL}/${type}/${category}?api_key=${CONFIG.API_KEY}&language=uz-UZ&page=1`;
                        const response = await fetch(url);
                        const data = await response.json();
                        return (data.results || []).map(movie => this.transform_movie(movie));
                } catch (error) {
                        console.error('Xatolik:', error);
                        return [];
                }
        },

        async search_content(query) {
                try {
                        const url = `${CONFIG.BASE_URL}/search/multi?api_key=${CONFIG.API_KEY}&language=uz-UZ&query=${encodeURIComponent(query)}&page=1`;
                        const response = await fetch(url);
                        const data = await response.json();
                        return (data.results || []).map(item => this.transform_movie(item));
                } catch (error) {
                        console.error('Qidiruvda xatolik:', error);
                        return [];
                }
        },

        async fetch_by_genre(genre_id) {
                try {
                        const url = `${CONFIG.BASE_URL}/discover/movie?api_key=${CONFIG.API_KEY}&language=uz-UZ&with_genres=${genre_id}&sort_by=popularity.desc`;
                        const response = await fetch(url);
                        const data = await response.json();
                        return (data.results || []).map(movie => this.transform_movie(movie));
                } catch (error) {
                        console.error('Janr bo\'yicha xatolik:', error);
                        return [];
                }
        },

        async get_trending() {
                try {
                        const url = `${CONFIG.BASE_URL}/trending/all/day?api_key=${CONFIG.API_KEY}&language=uz-UZ`;
                        const response = await fetch(url);
                        const data = await response.json();
                        return (data.results || []).map(item => this.transform_movie(item));
                } catch (error) {
                        console.error('Trendlarda xatolik:', error);
                        return [];
                }
        }
};
