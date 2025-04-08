/**
 * Classe pour gérer les graphiques
 */
class ChartHandler {
    constructor(config) {
        this.config = config;
        this.temperatureChart = null;
        this.humidityChart = null;
        this.historicalData = {
            labels: [],
            temperature: [],
            humidity: []
        };
    }
    
    /**
     * Initialise les graphiques
     */
    init() {
        // Récupérer les contextes de rendu des graphiques
        const temperatureCtx = document.getElementById('temperature-chart').getContext('2d');
        const humidityCtx = document.getElementById('humidity-chart').getContext('2d');
        
        // Créer le graphique de température
        this.temperatureChart = new Chart(temperatureCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Température (°C)',
                    data: [],
                    backgroundColor: this.config.backgroundColor[0],
                    borderColor: this.config.borderColor[0],
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Température: ${context.parsed.y.toFixed(1)} °C`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return value + ' °C';
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
        // Créer le graphique d'humidité
        this.humidityChart = new Chart(humidityCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Humidité (%)',
                    data: [],
                    backgroundColor: this.config.backgroundColor[1],
                    borderColor: this.config.borderColor[1],
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Humidité: ${context.parsed.y.toFixed(1)} %`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 0,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + ' %';
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
        // Récupérer les données historiques
        this.loadHistoricalData();
        
        // Configurer le rafraîchissement des données
        setInterval(() => {
            this.loadHistoricalData();
        }, this.config.refreshInterval);
        
        return this;
    }
    
    /**
     * Charge les données historiques depuis le serveur
     */
    loadHistoricalData() {
        fetch(`../includes/ajax_handler.php?action=get_mqtt_history&hours=${this.config.chartHours}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                this.updateCharts(result.data);
            } else {
                console.error('Erreur lors de la récupération de l\'historique MQTT:', result.error);
            }
        })
        .catch(error => {
            console.error('Erreur de requête pour l\'historique MQTT:', error);
        });
    }
    
    /**
     * Met à jour les graphiques avec de nouvelles données
     */
    updateCharts(data) {
        // Mettre à jour les données historiques
        this.historicalData = data;
        
        // Mettre à jour le graphique de température
        this.temperatureChart.data.labels = data.labels;
        this.temperatureChart.data.datasets[0].data = data.temperature;
        this.temperatureChart.update();
        
        // Mettre à jour le graphique d'humidité
        this.humidityChart.data.labels = data.labels;
        this.humidityChart.data.datasets[0].data = data.humidity;
        this.humidityChart.update();
    }
    
    /**
     * Ajoute un point de données MQTT aux graphiques
     */
    addMqttDataPoint(data) {
        if (!data || !data.temperature || !data.humidity) {
            return;
        }
        
        const now = new Date();
        const timeLabel = now.toLocaleTimeString();
        
        // Ajouter les données au graphique de température
        this.temperatureChart.data.labels.push(timeLabel);
        this.temperatureChart.data.datasets[0].data.push(data.temperature);
        
        // Limiter le nombre de points affichés
        if (this.temperatureChart.data.labels.length > 24) {
            this.temperatureChart.data.labels.shift();
            this.temperatureChart.data.datasets[0].data.shift();
        }
        
        // Mettre à jour le graphique de température
        this.temperatureChart.update();
        
        // Ajouter les données au graphique d'humidité
        this.humidityChart.data.labels.push(timeLabel);
        this.humidityChart.data.datasets[0].data.push(data.humidity);
        
        // Limiter le nombre de points affichés
        if (this.humidityChart.data.labels.length > 24) {
            this.humidityChart.data.labels.shift();
            this.humidityChart.data.datasets[0].data.shift();
        }
        
        // Mettre à jour le graphique d'humidité
        this.humidityChart.update();
    }
}

// Créer une instance du gestionnaire de graphiques
const chartHandler = new ChartHandler(CONFIG.charts); 