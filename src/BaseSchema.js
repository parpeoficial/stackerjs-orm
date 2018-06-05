

export function BaseSchema(schema) 
{

    const configs = {
        fields: [],
        ...schema
    };

    this.save = (item) => 
    {
        console.log(configs);
        return Promise.resolve(item);
    };

    return this;
}
