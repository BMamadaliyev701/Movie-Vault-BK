const Storage = {
        favorites_key: 'movie_vault_favorites',

        get_favorites() {
                const favs = localStorage.getItem(this.favorites_key);
                return favs ? JSON.parse(favs) : [];
        },

        save_favorite(movie_item) {
                let favs = this.get_favorites();
                if (!favs.some(f => f.movie_id === movie_item.movie_id)) {
                        movie_item.is_favorite = true;
                        favs.push(movie_item);
                        localStorage.setItem(this.favorites_key, JSON.stringify(favs));
                        return true;
                }
                return false;
        },

        remove_favorite(movie_id) {
                let favs = this.get_favorites();
                favs = favs.filter(f => f.movie_id !== movie_id);
                localStorage.setItem(this.favorites_key, JSON.stringify(favs));
        },

        is_favorite(movie_id) {
                const favs = this.get_favorites();
                return favs.some(f => f.movie_id === movie_id);
        }
};
