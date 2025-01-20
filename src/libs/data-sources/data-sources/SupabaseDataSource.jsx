export class SupabaseDataSource {
  constructor(table) {
    this.provider = 'Supabase';
    this.table = table;
  }

  async get(id) {
    const { data, error } = await supabase.from(this.table).select('*').eq('id', id).single();

    if (error) {
      console.error(error);
      return null;
    }
    return data;
  }

  async getAll(filter = {}) {
    let query = supabase.from(this.table).select('*');

    Object.keys(filter).forEach((key) => {
      query = query.eq(key, filter[key]);
    });

    const { data, error } = await query;
    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }

  async add(item) {
    const { data, error } = await supabase.from(this.table).insert(item).single();
    if (error) {
      console.error(error);
      throw error;
    }
    return data;
  }

  async delete(id) {
    const { error } = await supabase.from(this.table).delete().eq('id', id);
    if (error) {
      console.error(error);
      throw error;
    }
  }

  async update(id, data) {
    const { error } = await supabase.from(this.table).update(data).eq('id', id);
    if (error) {
      console.error(error);
      throw error;
    }
  }

  subscribe(callback) {
    const subscription = supabase
      .from(`${this.table}`)
      .on('*', () => {
        this.getAll().then(callback);
      })
      .subscribe();

    return () => supabase.removeSubscription(subscription);
  }
}
