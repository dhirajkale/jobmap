import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Map from '../components/Map'
import './HomePage.css'

export default function HomePage() {
    return (
        <div className="home-page">
            <Sidebar />
            <div className="home-page__main">
                <Header />
                <div className="home-page__map">
                    <Map />
                </div>
            </div>
        </div>
    )
}
