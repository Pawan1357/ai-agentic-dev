import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { ShellComponent } from './features/shell/shell.component';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [AppComponent, ShellComponent],
  imports: [BrowserModule, BrowserAnimationsModule, HttpClientModule, CoreModule, SharedModule, AppRoutingModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
