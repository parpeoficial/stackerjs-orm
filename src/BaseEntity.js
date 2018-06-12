

export class BaseEntity 
{

    set attributes(attributes) 
    {
        Object.keys(attributes).forEach(key =>
            this[key] = attributes[key]);
    }

}