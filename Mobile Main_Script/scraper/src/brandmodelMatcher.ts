import { databases, connectToDB } from "./db";

interface Brand {
    brand_id: number, 
    brand_name: string, 
    brand_r: RegExp
}

interface Model {
    model_id: number, 
    model_name: string, 
    model_r: RegExp
}

export default class BrandModelMatcher {
    private brands_regexp: Brand[];
    private models_regexp: { [key: string]: Model[] };

    constructor(brands_regexp, models_regexp) {
        if (typeof brands_regexp === 'undefined' || typeof models_regexp === 'undefined') {
            throw new Error("This class needs to be created with .init()");
        }
        this.brands_regexp = brands_regexp;
        this.models_regexp = models_regexp;
    }

    static async init() {
        const { brands_regexp, models_regexp } = await this.getData();
        return new BrandModelMatcher(brands_regexp, models_regexp);
    }

    private static async getData() {
        const connection = await connectToDB(databases.mobile);
        const brands_regexp: Brand[] = [];
        const models_regexp: { [key: string]: Model[] } = {};
        const [brands]: any = await connection.execute("SELECT * FROM brand");
        for (const brand of brands) {
            const { brand_id, brand_name } = brand;
            if (brand_name === 'Volkswagen') {
                brands_regexp.push({ brand_id, brand_name, brand_r: new RegExp(`\\b(VW)\\b`, 'i') });
            }
            brands_regexp.push({ brand_id, brand_name, brand_r: new RegExp(`\\b(${brand.brand_name})\\b`, 'i') });
            const [models]: any = await connection.execute(`SELECT * FROM model WHERE brand_id = ${brand_id}`);
            models_regexp[brand_id] = [];
            for (const model of models) {
                const { model_id, model_name } = model;
                models_regexp[brand_id].push({ model_id, model_name, model_r: new RegExp(`\\b(${model_name})\\b`, 'i') });
            }
        }
        connection.destroy();
        return { brands_regexp, models_regexp };
    }

    match(title: string): { matched_brand: number, matched_model: number } {
        let matched_brand = null;
        let matched_model = null;
        for (const brand of this.brands_regexp) {
            const { brand_id, brand_name, brand_r } = brand;
            if (title.match(brand_r)) {
                matched_brand = brand_id;
                for (const model of this.models_regexp[brand_id]) {
                    const { model_id, model_name, model_r } = model;
                    if (title.match(model_r)) {
                        matched_model = model_id;
                        break;
                    }
                }
                break;
            }
        }
        return { matched_brand, matched_model };
    }
}




