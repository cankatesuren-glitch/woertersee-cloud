package de.woertersee.api

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class WoerterseeApiApplication

fun main(args: Array<String>) {
	runApplication<WoerterseeApiApplication>(*args)
}
