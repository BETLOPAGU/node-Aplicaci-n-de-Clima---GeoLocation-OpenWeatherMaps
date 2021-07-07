const fs = require('fs');

const axios = require('axios');


class Busquedas{
    historial = [];
    dbPath = './db/database.json';

    constructor(){
        //TODO: leer BD si existe
        this.leerBD();
    }

    get paramsMapbox(){
        return{
            'access_token': process.env.MAPBOX_KEY,
            'limit': 5,
            'language': 'es'
        }
    }

    get paramWeather(){
        return{
            'appid': process.env.OPENWEATHER_KEY,
            'units': 'metric',
            'lang': 'es'
        }
    }

    get historialCapitalizado() {
        // Capitalizar cada palabra
        return this.historial.map( lugar => {
            let palabras = lugar.split(' ');
            palabras = palabras.map( p => p[0].toUpperCase() + p.substring(1) );

            return palabras.join(' ')
        })
    }


    async ciudad( lugar = ''){

        try{
            //petición http
            //console.log('ciudad', lugar);
            //const resp = await axios.get('https://api.mapbox.com/geocoding/v5/mapbox.places/Madrid.json?access_token=pk.eyJ1IjoibmFkbG9wIiwiYSI6ImNrcXNxZGFxbTF4ajAydm16YXludHIzdXMifQ.zp0KgJI5f2ITVjAUg9AmxA&limit=5&language=es');
            
            const intance = axios.create({
                baseURL: `https://api.mapbox.com/geocoding/v5/mapbox.places/${ lugar }.json`,
                params: this.paramsMapbox
            });

            const resp = await  intance.get();
            //console.log(resp.data.features);
            return resp.data.features.map( lugar => ({
                id: lugar.id,
                nombre: lugar.place_name,
                lng: lugar.center[0],
                lat: lugar.center[1],
            })); //retornar los lugares

        }catch(error){
            return [];
        }
    }

    async climaLugar( lat, lon){
        try {
            //intance axios.create()
            const intance = axios.create({
                baseURL: `https://api.openweathermap.org/data/2.5/weather`,
                params: { ...this.paramWeather, lat, lon }
            });

            //resp.data
            const resp = await intance.get();
            const { weather, main } = resp.data;

            return{
                desc: weather[0].description,
                min: main.temp_min,
                max: main.temp_max,
                temp: main.temp
            };

        } catch (error) {
            console.log(error);
        }
    }

    agregarHistorial( lugar = ''){
        //TODO: prevenir duplicados
        if(this.historial.includes( lugar.toLocaleLowerCase())){
            return;
        }

        this.historial = this.historial.splice(0,5); 
        this.historial.unshift( lugar.toLocaleLowerCase() );

        //Grabar BD
        this.guardarDB();
    }

    guardarDB(){
        const payload = {
            historial: this.historial
        };

        fs.writeFileSync( this.dbPath, JSON.stringify( payload));
    }

    leerBD(){
        //Debe existir ...
        if( !fs.existsSync(this.dbPath)) return;

        //const info .. readFileSync .... path {encoding:'utf-8 }
        const info = fs.readFileSync( this.dbPath, { encoding: 'utf-8'});
        const data = JSON.parse( info );

        this.historial = data.historial;
    }
}


module.exports = Busquedas;