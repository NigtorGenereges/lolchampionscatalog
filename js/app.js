const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {

        const champions = ref([]);
        const allChampions = ref([]);
        const loading = ref(false);
        const error = ref('');
        const searchQuery = ref('');
        const selectedTag = ref(null);
        

        const modalVisible = ref(false);
        const selectedChampion = ref(null);
        const championDetails = ref(null);      
        const loadingDetails = ref(false);       
        
        // список всех ролей
        const tags = ['Mage', 'Assassin', 'Fighter', 'Tank', 'Support', 'Marksman'];
        
        // актуальная версия api  
        let currentVersion = '14.1.1';
        
        // функция для получения актуальной версии Data Dragon
        const getLatestVersion = async () => {
            try {
                const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
                const versions = await res.json();
                currentVersion = versions[0];
                return currentVersion;
            } catch (err) {
                console.error('Ошибка получения версии', err);
                return '14.1.1';
            }
        };
        
        // загрузка чемпионов
        const loadChampions = async () => {
            loading.value = true;
            error.value = '';
            
            try {
                const version = await getLatestVersion();
                const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/ru_RU/champion.json`;
                const res = await fetch(url);
                
                if (!res.ok) throw new Error('Ошибка загрузки данных');
                
                const data = await res.json();
                
                const championsList = Object.values(data.data).map(champ => ({
                    id: champ.id,
                    key: champ.key,           
                    name: champ.name,
                    title: champ.title,
                    blurb: champ.blurb,
                    tags: champ.tags,
                    partype: champ.partype,
                    info: { ...champ.info },
                    stats: { ...champ.stats },
                    image: champ.image.full
                }));
                
                allChampions.value = championsList;
                champions.value = championsList;
                
            } catch (err) {
                error.value = 'Не удалось загрузить чемпионов.';
                console.error(err);
            } finally {
                loading.value = false;
            }
        };
        
        // загрузка детальной информации (способности)
        const loadChampionDetails = async (championId) => {
            loadingDetails.value = true;
            
            try {
                
                const url = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/ru_RU/champion/${championId}.json`;
                const res = await fetch(url);
                
                if (!res.ok) throw new Error('Ошибка загрузки деталей');
                
                const data = await res.json();
                const champData = data.data[championId];
                
                // парсим способности
                const spells = champData.spells.map(spell => ({
                    id: spell.id,
                    name: spell.name,
                    description: spell.description,
                    cooldown: spell.cooldownBurn,      
                    cost: spell.costBurn,               
                    range: spell.rangeBurn,             
                    image: spell.image.full
                }));
                
                //  пассивку
                const passive = {
                    name: champData.passive.name,
                    description: champData.passive.description,
                    image: champData.passive.image.full
                };
                
                championDetails.value = {
                    spells: spells,
                    passive: passive
                };
                
            } catch (err) {
                console.error('Ошибка загрузки способностей', err);
                championDetails.value = null;
            } finally {
                loadingDetails.value = false;
            }
        };
        
        // получение юрл изображения чемпиона
        const getChampionImage = (championId) => {
            return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_0.jpg`;
        };
        
        // получение юрл иконки способности
        const getSpellImage = (spellImage) => {
            return `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/spell/${spellImage}`;
        };
        
        // получение юрл иконки пассивки
        const getPassiveImage = (passiveImage) => {
            return `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/passive/${passiveImage}`;
        };
        
        // обработка ошибки изображения
        const handleImageError = (e) => {
            e.target.src = 'https://via.placeholder.com/120x120?text=No+Image';
        };
        
        // поиск чемпионов
        const searchChampions = () => {
            if (!searchQuery.value.trim()) {
                champions.value = allChampions.value;
                return;
            }
            
            const query = searchQuery.value.toLowerCase().trim();
            champions.value = allChampions.value.filter(champ => 
                champ.name.toLowerCase().includes(query) || 
                champ.title.toLowerCase().includes(query)
            );
        };
        
        // фильтр по роли
        const filterByTag = (tag) => {
            selectedTag.value = tag;
            applyFilters();
        };
        
        const clearTagFilter = () => {
            selectedTag.value = null;
            applyFilters();
        };
        
        const applyFilters = () => {
            let filtered = [...allChampions.value];
            
            if (searchQuery.value.trim()) {
                const query = searchQuery.value.toLowerCase().trim();
                filtered = filtered.filter(champ => 
                    champ.name.toLowerCase().includes(query) || 
                    champ.title.toLowerCase().includes(query)
                );
            }
            
            if (selectedTag.value) {
                filtered = filtered.filter(champ => 
                    champ.tags.includes(selectedTag.value)
                );
            }
            
            champions.value = filtered;
        };
        

        const filteredChampions = computed(() => champions.value);
        

        const openModal = async (champion) => {
            selectedChampion.value = champion;
            modalVisible.value = true;
            document.body.style.overflow = 'hidden';
            
            // детали о способностях
            await loadChampionDetails(champion.id);
        };
        
        const closeModal = () => {
            modalVisible.value = false;
            selectedChampion.value = null;
            championDetails.value = null;  
            document.body.style.overflow = '';
        };
        
        // загружаем данные при старте
        onMounted(() => {
            loadChampions();
        });
        
        return {
            champions,
            loading,
            error,
            searchQuery,
            selectedTag,
            tags,
            filteredChampions,
            modalVisible,
            selectedChampion,
            championDetails,      
            loadingDetails,       
            getChampionImage,
            getSpellImage,        
            getPassiveImage,      
            handleImageError,
            searchChampions,
            filterByTag,
            clearTagFilter,
            openModal,
            closeModal
        };
    }
}).mount('#app');