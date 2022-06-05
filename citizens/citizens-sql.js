export const createCityQuery = () => {
    return `insert into "cities" ("id", "name", "data") values ($1, $2, $3) returning id`
};

export const createCitizenQuery = () => {
    return `insert into "citizens" ("name", "cityId") values ($1, $2) returning id`
};

export const getUniqueTypes = () => {
    return `select distinct "type" from "citizensGroups"`
}

export const createGroupQuery = () => {
    return `insert into "citizensGroups" ("citizenId", "type", "name") values ($1, $2, $3) returning id`
};

export const getNamesByType = (filter) => {
    return `select distinct "name" from "citizensGroups" where "type"='${filter}' order by "name" ASC`;
};

export const getAll = () => {
    return `SELECT "citizens"."name" as "citizenName", "citizensGroups".*
            FROM "citizens"
            JOIN "citizensGroups" ON "citizensGroups"."citizenId" = "citizens"."id"`
};

export const getCitizenGroupsQuery = () => {
    return `select "name" from "citizensGroups" where "citizenId"=$1`
};


