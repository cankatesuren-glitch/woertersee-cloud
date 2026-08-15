package de.woertersee.api.learning

object DeckBalancer {
    fun <T> select(groups: Map<String, List<T>>, size: Int): List<T> {
        require(size >= 0)
        val queues = groups.toSortedMap().mapValues { (_, values) -> ArrayDeque(values.shuffled()) }.toMutableMap()
        val result = mutableListOf<T>()
        while (result.size < size) {
            var selected = false
            queues.values.forEach { queue ->
                if (result.size < size && queue.isNotEmpty()) {
                    result += queue.removeFirst()
                    selected = true
                }
            }
            if (!selected) break
        }
        return result
    }
}

