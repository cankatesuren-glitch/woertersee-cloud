package de.woertersee.api

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class WoerterseeApiApplication

fun main(args: Array<String>) {
	runApplication<WoerterseeApiApplication>(*args)
}
